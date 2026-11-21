"""Run transaction checks against a freshly migrated, disposable PostgreSQL DB."""

import os
import unittest
from types import SimpleNamespace

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError, DBAPIError

from app import create_app
from app.models import db
from app.models.distribution import Distribution
from app.services.distribution_service import DistributionService
from tests.api_test_case import ApiTestConfig


class DistributionPostgreSQLSmoke(unittest.TestCase):
    def test_distribution_lifecycle_preserves_stock_and_atomicity(self):
        value = os.environ.get("EFAS_TEST_DATABASE_URL")
        if not value:
            self.fail(
                "Set EFAS_TEST_DATABASE_URL to a disposable migrated PostgreSQL database."
            )
        try:
            url = make_url(value)
        except (ArgumentError, ValueError):
            raise AssertionError("The fixture database URL is invalid.") from None
        if (
            url.drivername not in {"postgresql", "postgresql+psycopg2"}
            or url.host != "127.0.0.1"
            or not url.port
            or url.port == 5432
            or url.query
            or not (url.database or "").startswith("efas_test_")
        ):
            self.fail(
                "Use a loopback efas_test_* database on a non-default port with no URL options."
            )

        class FixtureConfig(ApiTestConfig):
            SQLALCHEMY_DATABASE_URI = url

        with create_app(FixtureConfig).app_context():
            self.assertEqual(
                db.session.execute(text("SELECT COUNT(*) FROM users")).scalar(), 0
            )
            db.session.execute(
                text(
                    """
                INSERT INTO evacuation_centers
                    (center_name, address, coordinates, capacity, status)
                VALUES ('Fixture center', 'Fixture address', POINT(124, 8), 30, 'active');
                INSERT INTO events (event_name, event_type, date_declared)
                VALUES ('Fixture event', 'Flood', '2026-01-01');
                INSERT INTO users (email, password_hash, role)
                VALUES ('fixture@example.invalid', 'fixture-only', 'super_admin');
                INSERT INTO households (center_id, household_name)
                SELECT center_id, 'Fixture household' FROM evacuation_centers;
                INSERT INTO allocations (
                    category_id, center_id, event_id, resource_name, total_quantity,
                    remaining_quantity, distribution_type, allocated_by_user_id
                )
                SELECT category_id, evacuation_centers.center_id, event_id,
                       resource, 5, 5, 'per_household', user_id
                FROM aid_categories, evacuation_centers, events, users,
                     (VALUES ('Fixture water'), ('Fixture food')) AS items(resource)
                WHERE category_name = 'Food';
            """
                )
            )
            db.session.commit()
            center_id = db.session.execute(
                text("SELECT center_id FROM evacuation_centers")
            ).scalar()
            household_id = db.session.execute(
                text("SELECT household_id FROM households")
            ).scalar()
            user_id = db.session.execute(text("SELECT user_id FROM users")).scalar()
            allocation_ids = (
                db.session.execute(
                    text("SELECT allocation_id FROM allocations ORDER BY allocation_id")
                )
                .scalars()
                .all()
            )
            actor = SimpleNamespace(user_id=user_id, role="super_admin", is_active=True)
            details = {"center_id": center_id, "household_id": household_id}

            def record(second_quantity):
                return DistributionService.record_distribution(
                    actor,
                    {
                        **details,
                        "items": [
                            {"allocation_id": allocation_ids[0], "quantity": 2},
                            {
                                "allocation_id": allocation_ids[1],
                                "quantity": second_quantity,
                            },
                        ],
                    },
                )

            def counts():
                return db.session.execute(
                    text(
                        """
                    SELECT (SELECT COUNT(*) FROM distribution_sessions),
                           (SELECT COUNT(*) FROM distributions)
                """
                    )
                ).one()

            def stock():
                return (
                    db.session.execute(
                        text(
                            """
                    SELECT remaining_quantity FROM allocations ORDER BY allocation_id
                """
                        )
                    )
                    .scalars()
                    .all()
                )

            result, status = record(6)
            self.assertEqual(status, 400)
            self.assertEqual(
                result,
                {
                    "success": False,
                    "message": "Insufficient quantity in allocation.",
                },
            )
            self.assertEqual(counts(), (0, 0))
            self.assertEqual(stock(), [5, 5])

            _, status = record(1)
            self.assertEqual(status, 201)
            self.assertEqual(counts(), (1, 2))
            self.assertEqual(stock(), [3, 4])

            distribution_ids = (
                db.session.execute(
                    text(
                        "SELECT distribution_id FROM distributions ORDER BY allocation_id"
                    )
                )
                .scalars()
                .all()
            )
            first, second = distribution_ids

            self.assertEqual(
                Distribution.get_by_id(first, for_update=True)["status"], "completed"
            )
            with db.engine.connect() as concurrent_connection:
                with self.assertRaises(DBAPIError) as lock_refusal:
                    concurrent_connection.execute(
                        text(
                            "SELECT 1 FROM distributions "
                            "WHERE distribution_id = :id FOR UPDATE NOWAIT"
                        ),
                        {"id": first},
                    )
                self.assertEqual(lock_refusal.exception.orig.pgcode, "55P03")
            db.session.rollback()

            def edit(allocation_id, quantity, **changes):
                return DistributionService.update_distribution(
                    first,
                    {
                        **details,
                        "allocation_id": allocation_id,
                        "quantity": quantity,
                        **changes,
                    },
                )

            self.assertEqual(edit(allocation_ids[1], 6)[1], 400)
            self.assertEqual(stock(), [3, 4])
            self.assertEqual(
                Distribution.get_by_id(first)["allocation_id"], allocation_ids[0]
            )
            self.assertEqual(edit(allocation_ids[0], 1)[1], 200)
            self.assertEqual(stock(), [4, 4])
            self.assertEqual(edit(allocation_ids[1], 2)[1], 200)
            self.assertEqual(stock(), [5, 2])
            self.assertEqual(edit(allocation_ids[0], 2)[1], 200)
            self.assertEqual(stock(), [3, 4])
            self.assertEqual(
                edit(allocation_ids[0], 2, household_id=household_id + 1)[1], 409
            )
            self.assertEqual(stock(), [3, 4])

            def state(distribution_id):
                return db.session.execute(
                    text(
                        "SELECT status FROM distributions WHERE distribution_id = :id"
                    ),
                    {"id": distribution_id},
                ).scalar_one()

            self.assertEqual(DistributionService.toggle_status(first)[1], 200)
            self.assertEqual(state(first), "voided")
            self.assertEqual(stock(), [5, 4])
            self.assertEqual(edit(allocation_ids[0], 1)[1], 409)
            self.assertEqual(stock(), [5, 4])

            self.assertEqual(DistributionService.toggle_status(first)[1], 200)
            self.assertEqual(state(first), "completed")
            self.assertEqual(stock(), [3, 4])

            self.assertEqual(DistributionService.toggle_status(first)[1], 200)
            self.assertEqual(record(1)[1], 201)
            self.assertEqual(record(1)[1], 201)
            self.assertEqual(stock(), [1, 2])
            self.assertEqual(DistributionService.toggle_status(first)[1], 400)
            self.assertEqual(state(first), "voided")
            self.assertEqual(stock(), [1, 2])

            self.assertEqual(DistributionService.delete_distribution(first)[1], 200)
            self.assertEqual(stock(), [1, 2])

            db.session.execute(
                text(
                    "UPDATE allocations SET status = 'cancelled' WHERE allocation_id = :id"
                ),
                {"id": allocation_ids[1]},
            )
            db.session.commit()
            self.assertEqual(DistributionService.delete_distribution(second)[1], 200)
            self.assertEqual(stock(), [1, 3])
            self.assertEqual(
                db.session.execute(
                    text("SELECT status FROM allocations WHERE allocation_id = :id"),
                    {"id": allocation_ids[1]},
                ).scalar_one(),
                "cancelled",
            )

            destination_center = db.session.execute(
                text(
                    """
                INSERT INTO evacuation_centers (center_name, address, coordinates, capacity, status)
                VALUES ('Second center', 'Fixture address', POINT(125, 8), 30, 'active')
                RETURNING center_id
            """
                )
            ).scalar_one()
            destination_household = db.session.execute(
                text(
                    """
                INSERT INTO households (center_id, household_name)
                VALUES (:center_id, 'Second household') RETURNING household_id
            """
                ),
                {"center_id": destination_center},
            ).scalar_one()
            destination_allocation = db.session.execute(
                text(
                    """
                INSERT INTO allocations (
                    category_id, center_id, event_id, resource_name, total_quantity,
                    remaining_quantity, distribution_type, allocated_by_user_id
                )
                SELECT category_id, :center_id, event_id, 'Second stock', 5, 5,
                       distribution_type, allocated_by_user_id
                FROM allocations WHERE allocation_id = :old_id RETURNING allocation_id
            """
                ),
                {"center_id": destination_center, "old_id": allocation_ids[0]},
            ).scalar_one()
            db.session.commit()
            self.assertEqual(
                DistributionService.record_distribution(
                    actor,
                    {
                        **details,
                        "items": [{"allocation_id": allocation_ids[0], "quantity": 1}],
                    },
                )[1],
                201,
            )
            single = db.session.execute(
                text("SELECT MAX(distribution_id) FROM distributions")
            ).scalar_one()
            self.assertEqual(
                DistributionService.update_distribution(
                    single,
                    {
                        "household_id": destination_household,
                        "center_id": destination_center,
                        "allocation_id": destination_allocation,
                        "quantity": 1,
                    },
                )[1],
                200,
            )
            self.assertEqual(stock(), [1, 3, 4])
            moved = Distribution.get_by_id(single)
            self.assertEqual(
                (moved["center_id"], moved["household_id"]),
                (
                    destination_center,
                    destination_household,
                ),
            )


if __name__ == "__main__":
    unittest.main()
