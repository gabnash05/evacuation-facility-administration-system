"""Regression tests for user-route guard and validation ordering."""

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
