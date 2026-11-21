"""Exercise household ownership and rollback on a disposable database."""

import os
import unittest
from unittest.mock import patch

from sqlalchemy import text
from sqlalchemy.engine import make_url

from app import create_app
from app.models import db
from app.models.evacuation_center import EvacuationCenter
from app.models.individual import Individual
from app.services.household_service import HouseholdService
from app.services.individual_service import IndividualService
from tests.api_test_case import ApiTestConfig


class HouseholdPostgreSQLSmoke(unittest.TestCase):
    def test_concurrent_member_move_rolls_back_household_edit(self):
        url = make_url(os.environ["EFAS_TEST_DATABASE_URL"])
        if (
            url.drivername not in {"postgresql", "postgresql+psycopg2"}
            or url.host != "127.0.0.1"
            or not url.port
            or url.port == 5432
            or url.query
            or not (url.database or "").startswith("efas_test_")
        ):
            self.fail("Use a local disposable fixture database.")

        class FixtureConfig(ApiTestConfig):
            SQLALCHEMY_DATABASE_URI = url

        application = create_app(FixtureConfig)
        with application.app_context():
            self.assertEqual(
                db.session.execute(text("SELECT COUNT(*) FROM users")).scalar(), 0
            )
            created_center = EvacuationCenter.create(
                {
                    "center_name": "Coordinates",
                    "address": "Fixture address",
                    "capacity": 20,
                    "status": "active",
                    "longitude": 124.6,
                    "latitude": 8.2,
                }
            )
            EvacuationCenter.update(
                created_center.center_id, {"longitude": 125.1, "latitude": 9.3}
            )
            coordinates = db.session.execute(
                text(
                    "SELECT coordinates[0], coordinates[1] FROM evacuation_centers "
                    "WHERE center_id = :id"
                ),
                {"id": created_center.center_id},
            ).one()
            self.assertEqual(tuple(coordinates), (125.1, 9.3))
            db.session.execute(
                text(
                    """
                INSERT INTO evacuation_centers
                    (center_name, address, coordinates, capacity, status)
                VALUES ('Fixture', 'Fixture address', POINT(124, 8), 30, 'active');
                INSERT INTO households (center_id, household_name, address)
                SELECT center_id, name, 'Original address' FROM evacuation_centers,
                       (VALUES ('First'), ('Second')) AS names(name)
                WHERE center_name = 'Fixture';
                INSERT INTO individuals (household_id, first_name, last_name, relationship_to_head)
                SELECT household_id, 'Fixture', 'Person', 'Member' FROM households
                WHERE household_name = 'First';
            """
                )
            )
            db.session.commit()
            first, second = (
                db.session.execute(
                    text("SELECT household_id FROM households ORDER BY household_id")
                )
                .scalars()
                .all()
            )
            member = db.session.execute(
                text("SELECT individual_id FROM individuals")
            ).scalar_one()
            original_update = Individual.update

            def move_then_update(individual_id, data, *, household_id):
                with db.engine.begin() as connection:
                    connection.execute(
                        text(
                            "UPDATE individuals SET household_id = :household "
                            "WHERE individual_id = :id"
                        ),
                        {"household": second, "id": individual_id},
                    )
                return original_update(individual_id, data, household_id=household_id)

            with patch.object(Individual, "update", side_effect=move_then_update):
                result, status = HouseholdService.update_household(
                    first,
                    {
                        "address": "Changed address",
                        "individuals": [
                            {"individual_id": member, "first_name": "Changed"}
                        ],
                    },
                )
            self.assertEqual(status, 500)
            self.assertFalse(result["success"])
            self.assertEqual(
                db.session.execute(
                    text("SELECT address FROM households WHERE household_id = :id"),
                    {"id": first},
                ).scalar_one(),
                "Original address",
            )
            moved = db.session.execute(
                text(
                    "SELECT household_id, first_name FROM individuals WHERE individual_id = :id"
                ),
                {"id": member},
            ).one()
            self.assertEqual(tuple(moved), (second, "Fixture"))

            db.session.execute(
                text(
                    "UPDATE individuals SET household_id = :id WHERE individual_id = :member"
                ),
                {"id": first, "member": member},
            )
            db.session.commit()
            original_delete = Individual.delete_by_ids

            def move_then_delete(ids, *, household_id):
                with db.engine.begin() as connection:
                    connection.execute(
                        text(
                            "UPDATE individuals SET household_id = :household "
                            "WHERE individual_id = :id"
                        ),
                        {"household": second, "id": member},
                    )
                return original_delete(ids, household_id=household_id)

            with patch.object(
                Individual, "delete_by_ids", side_effect=move_then_delete
            ):
                result, status = HouseholdService.update_household(
                    first, {"address": "Changed address", "individuals": []}
                )
            self.assertEqual(status, 500)
            self.assertFalse(result["success"])
            self.assertEqual(
                db.session.execute(
                    text("SELECT address FROM households WHERE household_id = :id"),
                    {"id": first},
                ).scalar_one(),
                "Original address",
            )
            self.assertEqual(
                db.session.execute(
                    text(
                        "SELECT household_id FROM individuals WHERE individual_id = :id"
                    ),
                    {"id": member},
                ).scalar_one(),
                second,
            )
            result, status = HouseholdService.update_household(
                first, {"household_head_id": member}
            )
            self.assertEqual(status, 400)
            self.assertFalse(result["success"])
            db.session.rollback()
            result, status = HouseholdService.update_household(
                second, {"household_head_id": member}
            )
            self.assertEqual(status, 200)
            self.assertTrue(result["success"])
            self.assertEqual(
                db.session.execute(
                    text(
                        "SELECT household_head_id FROM households WHERE household_id = :id"
                    ),
                    {"id": second},
                ).scalar_one(),
                member,
            )
            db.session.execute(
                text(
                    "UPDATE individuals SET current_status = 'transferred' "
                    "WHERE individual_id = :id"
                ),
                {"id": member},
            )
            db.session.commit()
            result = IndividualService.recalculate_all_statuses()
            self.assertTrue(result["success"])
            with db.engine.connect() as connection:
                self.assertEqual(
                    connection.execute(
                        text(
                            "SELECT current_status FROM individuals WHERE individual_id = :id"
                        ),
                        {"id": member},
                    ).scalar_one(),
                    "checked_out",
                )

            center_id = db.session.execute(
                text(
                    "SELECT center_id FROM evacuation_centers WHERE center_name = 'Fixture'"
                )
            ).scalar_one()
            listed = Individual.get_all_paginated(center_id=center_id)
            self.assertEqual(len(listed), 1)
            self.assertEqual(Individual.get_count(center_id=center_id), 1)


if __name__ == "__main__":
    unittest.main()
