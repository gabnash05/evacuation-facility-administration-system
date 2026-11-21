"""Regression coverage for attendance checkout identity and transfer writes."""

import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.models.attendance_records import AttendanceRecord
from app.services import attendance_records_service


class AttendanceCheckoutIdentityTests(unittest.TestCase):
    @patch(
        "app.services.attendance_records_service.AttendanceRecord.check_out_individual"
    )
    @patch("app.services.attendance_records_service.AttendanceRecord.get_by_id")
    @patch("app.services.attendance_records_service.Individual.get_by_id")
    def test_service_uses_attendance_record_id_without_loading_same_numbered_individual(
        self, get_individual, get_record, check_out
    ):
        get_record.return_value = SimpleNamespace(
            status="checked_in", check_out_time=None
        )
        check_out.return_value = SimpleNamespace(to_dict=lambda: {"record_id": 41})

        result = attendance_records_service.check_out_individual(
            41, "2026-09-04T00:00:00"
        )

        self.assertTrue(result["success"])
        get_record.assert_called_once_with(41)
        get_individual.assert_not_called()
        check_out.assert_called_once_with(
            record_id=41, check_out_time="2026-09-04T00:00:00", notes=None
        )

    @patch.object(AttendanceRecord, "_check_out_by_record_id")
    def test_model_delegates_directly_to_the_requested_record_id(self, checkout):
        AttendanceRecord.check_out_individual(41, "2026-09-04T00:00:00", "Done")

        checkout.assert_called_once_with(41, "2026-09-04T00:00:00", "Done")


class AttendanceTransferTests(unittest.TestCase):
    @patch.object(AttendanceRecord, "get_by_id")
    @patch.object(AttendanceRecord, "validate_attendance_conditions", return_value=True)
    @patch.object(AttendanceRecord, "transfer_individual")
    def test_service_keeps_failed_transfer_details_private(
        self, transfer, validate, get_record
    ):
        get_record.return_value = SimpleNamespace(
            center_id=10, status="checked_in", check_out_time=None
        )
        transfer.side_effect = RuntimeError("Private transfer note")

        with self.assertLogs(attendance_records_service.logger, level="ERROR") as logs:
            result = attendance_records_service.transfer_individual(
                41, 20, "2026-01-02T12:00:00", recorded_by_user_id=1
            )

        validate.assert_called_once_with(20)
        self.assertEqual(
            result, {"success": False, "message": "Failed to transfer individual"}
        )
        self.assertNotIn("Private transfer note", "\n".join(logs.output))

    @patch("app.models.attendance_records.db", new_callable=Mock)
    @patch.object(AttendanceRecord, "get_by_id")
    @patch.object(AttendanceRecord, "get_current_event_for_center")
    @patch.object(AttendanceRecord, "update")
    @patch.object(AttendanceRecord, "create")
    def test_failed_destination_write_rolls_back_source(
        self, create, update, get_event, get_record, database
    ):
        get_record.return_value = SimpleNamespace(
            individual_id=21,
            household_id=8,
            center_id=10,
            status="checked_in",
            check_out_time=None,
        )
        get_event.return_value = 2
        create.side_effect = RuntimeError("Destination write failed")

        with self.assertRaisesRegex(RuntimeError, "Destination write failed"):
            AttendanceRecord.transfer_individual(41, 20, "2026-01-02T12:00:00", 1)

        get_record.assert_called_once_with(41, for_update=True)
        self.assertFalse(update.call_args.kwargs["commit"])
        self.assertFalse(create.call_args.kwargs["commit"])
        database.session.commit.assert_not_called()
        database.session.rollback.assert_called_once_with()
