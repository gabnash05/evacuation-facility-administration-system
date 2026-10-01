from types import SimpleNamespace
from unittest.mock import patch

from app.services.distribution_service import DistributionService
from app.models.distribution import DistributionSession
from tests.api_test_case import ApiTestCase


def user(role="volunteer", center_id=2, user_id=7):
    return SimpleNamespace(
        role=role, center_id=center_id, user_id=user_id, is_active=True
    )


class DistributionAuthorizationTests(ApiTestCase):
    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.toggle_status")
    def test_non_super_admin_cannot_toggle_distribution_status(self, toggle_status, get_by_id):
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
