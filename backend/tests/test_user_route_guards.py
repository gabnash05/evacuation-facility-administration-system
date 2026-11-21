"""Regression tests for user-route guard and validation ordering."""

from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


class UserRouteGuardTests(ApiTestCase):
    @patch("app.routes.user.get_users")
    def test_list_requires_a_jwt_before_calling_the_service(self, get_users):
        response = self.client.get("/api/users")

        self.assertEqual(response.status_code, 401)
        get_users.assert_not_called()

    @patch("app.routes.user.get_users")
    def test_list_rejects_an_invalid_page_before_calling_the_service(self, get_users):
        response = self.client.get(
            "/api/users?page=0", headers=self.authorization_headers()
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["message"], "Page must be at least 1")
        get_users.assert_not_called()

    @patch("app.routes.user.get_current_user")
    @patch("app.routes.user.get_users")
    def test_list_uses_the_documented_typed_center_id_parameter(
        self, get_users, get_current_user
    ):
        get_current_user.return_value = SimpleNamespace(is_active=True)
        get_users.return_value = {"success": True, "data": {"users": []}}

        response = self.client.get(
            "/api/users?center_id=12", headers=self.authorization_headers()
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(get_users.call_args.kwargs["center_id"], 12)
