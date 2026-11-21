from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def actor(role, center_id=None):
    return SimpleNamespace(role=role, center_id=center_id, is_active=True)


class HouseholdRouteAuthorizationTests(ApiTestCase):
    @patch("app.routes.households.get_current_user")
    @patch("app.routes.households.HouseholdService.get_all_households")
    def test_lower_roles_are_forced_to_their_assigned_center(
        self, get_all_households, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)
        get_all_households.return_value = {"success": True, "data": {"results": []}}

        response = self.client.get(
            "/api/households", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(get_all_households.call_args.args[0]["center_id"], 2)

    @patch("app.routes.households.get_current_user")
    @patch("app.routes.households.HouseholdService.get_all_households")
    def test_lower_roles_cannot_request_another_center(
        self, get_all_households, get_current_user
    ):
        get_current_user.return_value = actor("center_admin", 2)

        response = self.client.get(
            "/api/households?center_id=3", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        get_all_households.assert_not_called()

    @patch("app.routes.households.get_current_user")
    @patch("app.routes.households.HouseholdService.delete_household")
    def test_volunteer_cannot_delete_household(
        self, delete_household, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)

        response = self.client.delete(
            "/api/households/1", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        delete_household.assert_not_called()

    @patch("app.routes.households.get_current_user")
    @patch("app.routes.households.HouseholdService.create_household_with_individuals")
    def test_lower_roles_create_households_in_their_assigned_center(
        self, create_household_with_individuals, get_current_user
    ):
        get_current_user.return_value = actor("center_admin", 2)
        create_household_with_individuals.return_value = ({"success": True}, 201)

        response = self.client.post(
            "/api/households-with-individuals",
            json={"household_name": "Dela Cruz"},
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            create_household_with_individuals.call_args.args[0]["center_id"], 2
        )

    @patch("app.routes.households.get_current_user")
    @patch("app.routes.households.Household.get_by_id")
    @patch("app.routes.households.HouseholdService.get_household_by_id")
    def test_lower_roles_cannot_read_a_household_in_another_center(
        self, get_household_by_id, get_by_id, get_current_user
    ):
        get_current_user.return_value = actor("center_admin", 2)
        get_by_id.return_value = {"center_id": 3}

        response = self.client.get(
            "/api/households/1", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        get_household_by_id.assert_not_called()
