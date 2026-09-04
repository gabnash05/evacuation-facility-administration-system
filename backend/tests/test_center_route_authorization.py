"""Regression tests for evacuation-center route authorization."""

from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def actor(role, center_id=None):
    return SimpleNamespace(role=role, center_id=center_id, is_active=True)


class CenterRouteAuthorizationTests(ApiTestCase):
    @patch("app.routes.evacuation_centers.get_current_user")
    @patch("app.routes.evacuation_centers.get_centers")
    def test_volunteer_cannot_use_citywide_center_list(
        self, get_centers, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)

        response = self.client.get(
            "/api/evacuation_centers", headers=self.authorization_headers(1)
        )

        self.assertEqual(response.status_code, 403)
        get_centers.assert_not_called()

    @patch("app.routes.evacuation_centers.get_current_user")
    @patch("app.routes.evacuation_centers.get_center_by_id")
    def test_center_admin_cannot_read_another_center(self, get_center, get_current_user):
        get_current_user.return_value = actor("center_admin", 2)

        response = self.client.get(
            "/api/evacuation_centers/3", headers=self.authorization_headers(1)
        )

        self.assertEqual(response.status_code, 403)
        get_center.assert_not_called()

    @patch("app.routes.evacuation_centers.get_current_user")
    @patch("app.routes.evacuation_centers.create_center")
    def test_city_admin_cannot_create_a_center(self, create_center, get_current_user):
        get_current_user.return_value = actor("city_admin")

        response = self.client.post(
            "/api/evacuation_centers",
            headers=self.authorization_headers(1),
            json={"center_name": "Blocked"},
        )

        self.assertEqual(response.status_code, 403)
        create_center.assert_not_called()
