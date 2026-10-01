from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def actor(role, center_id=None):
    return SimpleNamespace(role=role, center_id=center_id, is_active=True)


class IndividualRouteAuthorizationTests(ApiTestCase):
    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.get_all_individuals")
    def test_lower_roles_are_forced_to_their_assigned_center(
        self, get_all_individuals, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)
        get_all_individuals.return_value = {"success": True, "data": {"results": []}}

        response = self.client.get(
            "/api/individuals", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(get_all_individuals.call_args.args[0]["center_id"])
        self.assertEqual(get_all_individuals.call_args.args[0]["assigned_center_id"], 2)

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.get_all_individuals")
    def test_lower_roles_cannot_request_another_center(
        self, get_all_individuals, get_current_user
    ):
        get_current_user.return_value = actor("center_admin", 2)

        response = self.client.get(
            "/api/individuals?center_id=3", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        get_all_individuals.assert_not_called()

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.recalculate_all_statuses")
    def test_only_super_admin_can_recalculate_all_statuses(
        self, recalculate, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)

        response = self.client.post(
            "/api/individuals/recalculate-statuses",
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 403)
        recalculate.assert_not_called()

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.search_individuals_by_name")
    def test_lower_role_search_is_scoped_to_assigned_center(
        self, search_individuals_by_name, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)
        search_individuals_by_name.return_value = {"success": True, "data": []}

        response = self.client.get(
            "/api/individuals/search?name=Ana", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(search_individuals_by_name.call_args.args, ("Ana", 10, 2))

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.get_status_summary")
    def test_lower_role_status_summary_is_scoped_to_assigned_center(
        self, get_status_summary, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)
        get_status_summary.return_value = {"success": True, "data": {"summary": {}}}

        response = self.client.get(
            "/api/individuals/status-summary", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(get_status_summary.call_args.args[0]["assigned_center_id"], 2)

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.IndividualService.delete_individuals")
    def test_volunteer_cannot_delete_individuals(
        self, delete_individuals, get_current_user
    ):
        get_current_user.return_value = actor("volunteer", 2)

        response = self.client.delete(
            "/api/individuals", json={"ids": [1]}, headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        delete_individuals.assert_not_called()

    @patch("app.routes.individuals.get_current_user")
    @patch("app.routes.individuals.Individual.get_by_id")
    @patch("app.routes.individuals.IndividualService.get_individual_by_id")
    def test_lower_roles_cannot_read_an_individual_in_another_center(
        self, get_individual_by_id, get_by_id, get_current_user
    ):
        get_current_user.return_value = actor("center_admin", 2)
        get_by_id.return_value = {"household": {"center_id": 3}}

        response = self.client.get(
            "/api/individuals/1", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        get_individual_by_id.assert_not_called()
