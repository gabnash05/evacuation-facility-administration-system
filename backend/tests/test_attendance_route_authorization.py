from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def actor(role="volunteer", center_id=2, user_id=7):
    return SimpleNamespace(
        role=role, center_id=center_id, user_id=user_id, is_active=True
    )


class AttendanceRouteAuthorizationTests(ApiTestCase):
    @patch("app.routes.attendance_records.check_out_multiple_individuals")
    @patch("app.routes.attendance_records.check_out_individual")
    @patch("app.routes.attendance_records.get_current_user")
    def test_checkout_rejects_unassigned_or_inactive_actors(
        self, get_user, checkout, batch
    ):
        requests = (
            ("PUT", "/api/attendance/1/check-out", {}),
            ("POST", "/api/attendance/check-out/batch", [{"record_id": 1}]),
        )
        for method, path, payload in requests:
            for user, expected in (
                (None, 401),
                (actor(center_id=None), 403),
                (actor(role="unknown"), 403),
            ):
                with self.subTest(path=path, user=user):
                    get_user.return_value = user
                    response = self.client.open(
                        path,
                        method=method,
                        json=payload,
                        headers=self.authorization_headers(7),
                    )
                    self.assertEqual(response.status_code, expected)
        checkout.assert_not_called()
        batch.assert_not_called()

    @patch("app.routes.attendance_records.get_attendance_summary_by_center")
    @patch("app.routes.attendance_records.get_attendance_record_by_id")
    @patch("app.routes.attendance_records.get_current_user")
    def test_detail_and_summary_reject_unassigned_actor(
        self, get_user, get_record, summary
    ):
        get_user.return_value = actor(center_id=None)
        for path in ("/api/attendance/1", "/api/attendance/summary/center/2"):
            response = self.client.get(path, headers=self.authorization_headers(7))
            self.assertEqual(response.status_code, 403)
        get_record.assert_not_called()
        summary.assert_not_called()

    @patch("app.routes.attendance_records.get_attendance_record_by_id")
    @patch("app.routes.attendance_records.get_current_user")
    def test_detail_queries_once_and_checks_center(self, get_user, get_record):
        get_user.return_value = actor()
        get_record.return_value = {"success": True, "data": {"center_id": 3}}
        response = self.client.get(
            "/api/attendance/1", headers=self.authorization_headers(7)
        )
        self.assertEqual(response.status_code, 403)
        get_record.assert_called_once_with(1)
        get_record.return_value = {"success": True, "data": {"center_id": 2}}
        response = self.client.get(
            "/api/attendance/1", headers=self.authorization_headers(7)
        )
        self.assertEqual(response.status_code, 200)

    @patch("app.routes.attendance_records.get_current_user")
    def test_attendance_lists_reject_unassigned_or_inactive_accounts(self, get_user):
        paths = (
            "/api/attendance/current",
            "/api/attendance/event/1",
            "/api/attendance/transfers",
        )
        for path in paths:
            for user, expected in ((None, 401), (actor(center_id=None), 403)):
                with self.subTest(path=path, user=user):
                    get_user.return_value = user
                    response = self.client.get(
                        path, headers=self.authorization_headers(7)
                    )
                    self.assertEqual(response.status_code, expected)

    @patch("app.routes.attendance_records.get_transfer_records")
    @patch("app.routes.attendance_records.get_event_attendance")
    @patch("app.routes.attendance_records.get_current_user")
    def test_event_and_transfer_lists_force_assigned_center(
        self, get_user, event, transfers
    ):
        get_user.return_value = actor()
        event.return_value = {"success": True, "data": []}
        transfers.return_value = {"success": True, "data": []}
        for path in ("/api/attendance/event/1", "/api/attendance/transfers"):
            self.assertEqual(
                self.client.get(
                    path, headers=self.authorization_headers(7)
                ).status_code,
                200,
            )
        self.assertEqual(event.call_args.kwargs["center_id"], 2)
        self.assertEqual(transfers.call_args.kwargs["center_id"], 2)

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
