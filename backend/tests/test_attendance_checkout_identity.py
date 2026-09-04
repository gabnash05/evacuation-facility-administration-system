"""Regression coverage for attendance checkout record identity."""

import unittest
from types import SimpleNamespace
from unittest.mock import patch

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
