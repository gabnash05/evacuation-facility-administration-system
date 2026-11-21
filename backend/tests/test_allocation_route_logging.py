"""Regression coverage for allocation route audit logging."""

from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


class AllocationRouteLoggingTests(ApiTestCase):
    @patch("app.routes.aid_allocation.update_allocation")
    @patch("app.routes.aid_allocation.logger.info")
    @patch("app.routes.aid_allocation.get_current_user")
    def test_update_logs_actor_id_without_email(
        self, get_current_user, logger_info, update_allocation
    ):
        get_current_user.return_value = SimpleNamespace(
            user_id=3, role="super_admin", email="private@example.test"
        )
        update_allocation.return_value = {"success": True, "data": {"allocation_id": 4}}

        response = self.client.put(
            "/api/allocations/4",
            headers=self.authorization_headers(3),
            json={"resource_name": "Water"},
        )

        self.assertEqual(response.status_code, 200)
        update_allocation.assert_called_once_with(4, {"resource_name": "Water"})
        logger_info.assert_called_once_with("User %s updating allocation: %s", 3, 4)
