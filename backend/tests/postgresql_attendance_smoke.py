"""Verify a singleton transfer against a freshly migrated PostgreSQL fixture."""

import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from threading import Barrier

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError, IntegrityError

from app import create_app
from app.models import db
from app.models.attendance_records import AttendanceRecord
from tests.api_test_case import ApiTestConfig


class AttendancePostgreSQLSmoke(unittest.TestCase):
    def test_transfer_rolls_back_on_failed_insert_and_serializes_retries(self):
        value = os.environ.get("EFAS_TEST_DATABASE_URL")
        if not value:
            self.fail("Set EFAS_TEST_DATABASE_URL to a migrated PostgreSQL fixture.")
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
            self.fail("Use a loopback efas_test_* database on a non-default port.")

        class FixtureConfig(ApiTestConfig):
            SQLALCHEMY_DATABASE_URI = url

        application = create_app(FixtureConfig)
        transfer_time = datetime(2026, 1, 2, 12)
        with application.app_context():
            self.assertEqual(
                db.session.execute(text("SELECT COUNT(*) FROM users")).scalar(), 0
            )
            db.session.execute(
                text(
                    """
                    INSERT INTO evacuation_centers
                        (center_name, address, coordinates, capacity, status)
                    VALUES ('Source', 'Fixture address', POINT(124, 8), 30, 'active'),
                           ('Destination', 'Fixture address', POINT(124, 8), 30, 'active');
                    INSERT INTO events (event_name, event_type, date_declared, capacity)
                    VALUES ('Fixture event', 'Flood', '2026-01-01', 60);
                    INSERT INTO event_centers (event_id, center_id)
                    SELECT event_id, center_id FROM events CROSS JOIN evacuation_centers;
                    INSERT INTO users (email, password_hash, role)
                    VALUES ('fixture@example.invalid', 'fixture-only', 'super_admin');
                    INSERT INTO households (center_id, household_name)
                    SELECT center_id, 'Fixture household' FROM evacuation_centers
                    WHERE center_name = 'Source';
                    INSERT INTO individuals
                        (household_id, first_name, last_name, relationship_to_head)
                    SELECT household_id, 'Fixture', 'Person', 'Head' FROM households;
                    """
                )
            )
            source_id, destination_id = (
                db.session.execute(
                    text("SELECT center_id FROM evacuation_centers ORDER BY center_id")
                )
                .scalars()
                .all()
            )
            user_id = db.session.execute(text("SELECT user_id FROM users")).scalar_one()
            individual_id, household_id = db.session.execute(
                text("SELECT individual_id, household_id FROM individuals")
            ).one()
            source = AttendanceRecord.create(
                {
                    "individual_id": individual_id,
                    "household_id": household_id,
                    "center_id": source_id,
                    "status": "checked_in",
                    "check_in_time": datetime(2026, 1, 2, 11),
                    "recorded_by_user_id": user_id,
                }
            )
            record_id = source.record_id

            def occupancies():
                return (
                    db.session.execute(
                        text(
                            "SELECT current_occupancy FROM evacuation_centers ORDER BY center_id"
                        )
                    )
                    .scalars()
                    .all()
                )

            with self.assertRaises(IntegrityError) as failure:
                AttendanceRecord.transfer_individual(
                    record_id, destination_id, transfer_time.isoformat(), -1
                )
            self.assertEqual(failure.exception.orig.pgcode, "23503")
            unchanged = AttendanceRecord.get_by_id(record_id)
            self.assertEqual(unchanged.status, "checked_in")
            self.assertIsNone(unchanged.check_out_time)
            self.assertEqual(occupancies(), [1, 0])
            self.assertEqual(
                db.session.execute(
                    text("SELECT COUNT(*) FROM attendance_records")
                ).scalar(),
                1,
            )
            db.session.rollback()

            start = Barrier(2, timeout=10)

            def attempt_transfer():
                with application.app_context():
                    db.session.execute(text("SET LOCAL lock_timeout = '5s'"))
                    start.wait()
                    try:
                        return AttendanceRecord.transfer_individual(
                            record_id,
                            destination_id,
                            transfer_time.isoformat(),
                            user_id,
                        )
                    except ValueError as error:
                        self.assertEqual(
                            str(error), "Individual is not currently checked in"
                        )
                        return None

            with ThreadPoolExecutor(max_workers=2) as pool:
                attempts = list(pool.map(lambda _: attempt_transfer(), range(2)))
            transferred = [record for record in attempts if record is not None]
            self.assertEqual(len(transferred), 1)
            transfer = transferred[0]
            self.assertEqual(transfer.status, "transferred")
            self.assertEqual(transfer.center_id, destination_id)
            self.assertEqual(transfer.event_id, source.event_id)
            self.assertEqual(transfer.transfer_from_center_id, source_id)
            self.assertEqual(transfer.transfer_to_center_id, destination_id)
            self.assertEqual(transfer.recorded_by_user_id, user_id)
            self.assertEqual(transfer.transfer_time, transfer_time)
            self.assertIsNone(transfer.check_in_time)
            checked_out = AttendanceRecord.get_by_id(record_id)
            self.assertEqual(checked_out.status, "checked_out")
            self.assertEqual(checked_out.check_out_time, transfer_time)
            self.assertEqual(occupancies(), [0, 0])
            self.assertEqual(
                db.session.execute(
                    text("SELECT COUNT(*) FROM attendance_records")
                ).scalar(),
                2,
            )


if __name__ == "__main__":
    unittest.main()
