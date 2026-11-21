from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def actor(role="volunteer", center_id=2, user_id=7):
    return SimpleNamespace(
        role=role, center_id=center_id, user_id=user_id, is_active=True
    )


class AttendanceRouteAuthorizationTests(ApiTestCase):
    @patch("app.routes.attendance_records.get_attendance_records")
    @patch("app.routes.attendance_records.get_current_user")
    def test_attendance_list_requires_active_scoped_actor(self, get_user, get_records):
        for user, expected in (
            (None, 401),
            (SimpleNamespace(is_active=False), 401),
            (actor(center_id=None), 403),
            (actor(role="unknown"), 403),
        ):
            with self.subTest(user=user):
                get_user.return_value = user
                response = self.client.get(
                    "/api/attendance", headers=self.authorization_headers(7)
                )
                self.assertEqual(response.status_code, expected)
        get_records.assert_not_called()

    @patch("app.routes.attendance_records.get_attendance_records")
    @patch("app.routes.attendance_records.get_current_user")
    def test_attendance_list_forces_assigned_center(self, get_user, get_records):
        get_user.return_value = actor()
        get_records.return_value = {"success": True, "data": []}
        response = self.client.get(
            "/api/attendance", headers=self.authorization_headers(7)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(get_records.call_args.kwargs["center_id"], 2)
        denied = self.client.get(
            "/api/attendance?center_id=3", headers=self.authorization_headers(7)
        )
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(get_records.call_count, 1)

        get_user.return_value = actor(role="city_admin", center_id=None)
        city = self.client.get("/api/attendance", headers=self.authorization_headers(7))
        self.assertEqual(city.status_code, 200)
        self.assertIsNone(get_records.call_args.kwargs["center_id"])

    @patch("app.routes.attendance_records.get_current_user")
    @patch("app.routes.attendance_records.check_in_individual")
    @patch(
        "app.models.attendance_records.AttendanceRecord.validate_attendance_conditions"
    )
    def test_check_in_uses_authenticated_actor_for_audit_attribution(
        self, validate_conditions, check_in, get_current_user
    ):
        get_current_user.return_value = actor()
        validate_conditions.return_value = True
        check_in.return_value = {"success": True, "data": {}}

        response = self.client.post(
            "/api/attendance/check-in",
            json={"individual_id": 1, "center_id": 2, "recorded_by_user_id": 99},
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(check_in.call_args.kwargs["recorded_by_user_id"], 7)

    @patch("app.routes.attendance_records.get_current_user")
    @patch("app.routes.attendance_records.Individual.get_by_id")
    @patch("app.routes.attendance_records.get_individual_attendance_history")
    def test_lower_roles_cannot_read_history_outside_their_assigned_center(
        self, get_history, get_by_id, get_current_user
    ):
        get_current_user.return_value = actor()
        get_by_id.return_value = {"household": {"center_id": 3}}

        response = self.client.get(
            "/api/attendance/history/individual/1",
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 403)
        get_history.assert_not_called()

    @patch("app.routes.attendance_records.get_current_user")
    @patch("app.routes.attendance_records.check_in_individual")
    @patch(
        "app.models.attendance_records.AttendanceRecord.validate_attendance_conditions"
    )
    def test_batch_check_in_uses_authenticated_actor_for_audit_attribution(
        self, validate_conditions, check_in, get_current_user
    ):
        get_current_user.return_value = actor()
        validate_conditions.return_value = True
        check_in.return_value = {"success": True, "data": {}}

        response = self.client.post(
            "/api/attendance/check-in/batch",
            json=[{"individual_id": 1, "center_id": 2, "recorded_by_user_id": 99}],
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(check_in.call_args.kwargs["recorded_by_user_id"], 7)

    @patch("app.routes.attendance_records.get_current_user")
    @patch("app.routes.attendance_records.transfer_individual")
    @patch("app.routes.attendance_records.get_attendance_record_by_id")
    @patch(
        "app.models.attendance_records.AttendanceRecord.validate_attendance_conditions"
    )
    def test_transfer_uses_authenticated_actor_for_audit_attribution(
        self, validate_conditions, get_record, transfer, get_current_user
    ):
        get_current_user.return_value = actor()
        validate_conditions.return_value = True
        get_record.return_value = {"success": True, "data": {"center_id": 2}}
        transfer.return_value = {"success": True, "data": {}}

        response = self.client.put(
            "/api/attendance/1/transfer",
            json={"transfer_to_center_id": 3, "recorded_by_user_id": 99},
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(transfer.call_args.kwargs["recorded_by_user_id"], 7)
