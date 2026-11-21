from types import SimpleNamespace
from unittest.mock import patch

from app.models.distribution import DistributionSession
from app.services.distribution_service import DistributionService
from tests.api_test_case import ApiTestCase


def user(role="volunteer", center_id=2, user_id=7):
    return SimpleNamespace(
        role=role, center_id=center_id, user_id=user_id, is_active=True
    )


class DistributionAuthorizationTests(ApiTestCase):
    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_requires_a_center_for_center_scoped_roles(
        self, history, get_by_id
    ):
        for role in ("center_admin", "volunteer"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=None)
                response = self.client.get(
                    "/api/distributions/history", headers=self.authorization_headers(7)
                )

                self.assertEqual(response.status_code, 403)
                self.assertEqual(
                    response.json["message"], "No center assigned to this account"
                )
        history.assert_not_called()

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_passes_the_assigned_center_for_center_scoped_roles(
        self, history, get_by_id
    ):
        history.return_value = ({"success": True}, 200)
        for role in ("center_admin", "volunteer"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=2)
                response = self.client.get(
                    "/api/distributions/history",
                    query_string={"center_id": 3},
                    headers=self.authorization_headers(7),
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(history.call_args.args[0]["center_id"], 2)

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_retains_citywide_administrator_access(self, history, get_by_id):
        history.return_value = ({"success": True}, 200)
        for role in ("city_admin", "super_admin"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=None)
                response = self.client.get(
                    "/api/distributions/history", headers=self.authorization_headers(7)
                )

                self.assertEqual(response.status_code, 200)
                self.assertIsNone(history.call_args.args[0].get("center_id"))

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_rejects_unrecognized_role(self, history, get_by_id):
        get_by_id.return_value = user(role="unknown")
        response = self.client.get(
            "/api/distributions/history", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        history.assert_not_called()

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.toggle_status")
    def test_non_super_admin_cannot_toggle_distribution_status(
        self, toggle_status, get_by_id
    ):
        get_by_id.return_value = user()

        response = self.client.patch(
            "/api/distributions/1/status", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        toggle_status.assert_not_called()

    @patch("app.services.distribution_service.Allocation.get_by_id")
    @patch("app.services.distribution_service.Household.get_by_id")
    def test_distribution_rejects_allocation_from_another_center(
        self, get_household, get_allocation
    ):
        get_household.return_value = {"center_id": 2}
        get_allocation.return_value = SimpleNamespace(
            center_id=3, event_id=1, status="active"
        )

        result, status = DistributionService.record_distribution(
            user(),
            {
                "household_id": 1,
                "center_id": 2,
                "items": [{"allocation_id": 1, "quantity": 1}],
            },
        )

        self.assertEqual(status, 403)
        self.assertFalse(result["success"])

    def test_session_binds_the_service_supplied_event_id(self):
        with self.app.app_context():
            with patch("app.models.distribution.db.session.execute") as execute, patch(
                "app.models.distribution.db.session.commit"
            ):
                execute.return_value.fetchone.return_value = SimpleNamespace(
                    _asdict=lambda: {"session_id": 1}
                )
                DistributionSession.create(
                    {
                        "household_id": 1,
                        "user_id": 7,
                        "center_id": 2,
                        "event_id": 3,
                        "notes": "",
                    }
                )

        self.assertEqual(execute.call_args.args[1]["event_id"], 3)
