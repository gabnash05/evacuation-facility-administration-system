"""Regression tests for user-management role and center authorization."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.models.user import User
from app.services import user_service
from tests.api_test_case import ApiTestCase


def user(user_id, role, center_id=None, is_active=True):
    return SimpleNamespace(
        user_id=user_id, role=role, center_id=center_id, is_active=is_active
    )


class UserAuthorizationPolicyTests(ApiTestCase):
    @patch("app.routes.user.get_current_user")
    def test_volunteer_cannot_list_users(self, get_current_user):
        get_current_user.return_value = user(7, "volunteer", 2)

        response = self.client.get("/api/users", headers=self.authorization_headers(7))

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["message"], "Insufficient permissions")

    @patch("app.routes.user.get_current_user")
    @patch("app.routes.user.create_user")
    @patch("app.routes.user.logger.info")
    def test_center_admin_can_create_volunteer_at_own_center_without_logging_email(
        self, logger_info, create_user, get_current_user
    ):
        actor = user(3, "center_admin", 12)
        get_current_user.return_value = actor
        create_user.return_value = {"success": True, "data": {"user_id": 20}}

        response = self.client.post(
            "/api/users",
            headers=self.authorization_headers(3),
            json={
                "email": "volunteer@example.test",
                "password": "secret123",
                "role": "volunteer",
                "center_id": 12,
            },
        )

        self.assertEqual(response.status_code, 201)
        create_user.assert_called_once_with(
            {
                "email": "volunteer@example.test",
                "password": "secret123",
                "role": "volunteer",
                "center_id": 12,
            },
            actor,
        )
        logger_info.assert_called_once_with("Creating new user")


class UserAuthorizationHelperTests(ApiTestCase):
    def test_center_admin_cannot_manage_other_center_or_higher_role(self):
        actor = user(3, "center_admin", 12)

        self.assertTrue(user_service._authorizes_role(actor, "volunteer", 12))
        self.assertFalse(user_service._authorizes_role(actor, "volunteer", 13))
        self.assertFalse(user_service._authorizes_role(actor, "center_admin", 12))

    def test_center_admin_cannot_mutate_own_or_other_center_volunteer(self):
        actor = user(3, "center_admin", 12)

        self.assertIsNotNone(
            user_service._authorize_target(actor, user(3, "center_admin", 12))
        )
        self.assertIsNotNone(
            user_service._authorize_target(actor, user(8, "volunteer", 13))
        )
        self.assertIsNone(
            user_service._authorize_target(actor, user(8, "volunteer", 12))
        )

    @patch("app.services.user_service.User.update_user")
    @patch("app.services.user_service.User.get_by_id")
    def test_update_rejects_a_center_role_without_a_center(
        self, get_by_id, update_user
    ):
        get_by_id.return_value = user(8, "volunteer", 12)

        result = user_service.update_user(8, {"center_id": None}, user(2, "city_admin"))

        self.assertFalse(result["success"])
        self.assertIn("center_id is required", result["message"])
        update_user.assert_not_called()

    @patch("app.services.user_service.logger.info")
    @patch("app.services.user_service.User.create_from_schema")
    @patch("app.services.user_service.User.get_by_email")
    def test_registration_log_does_not_include_email(
        self, get_by_email, create_from_schema, logger_info
    ):
        get_by_email.return_value = None
        create_from_schema.return_value = user(9, "volunteer", 12)

        result = user_service.register_user(
            "private@example.test", "secret123", "volunteer", 12, user(1, "super_admin")
        )

        self.assertTrue(result["success"])
        logger_info.assert_called_once_with("User registered successfully with role %s", "volunteer")


class UserModelAuthorizationTests(ApiTestCase):
    @patch("app.models.user.db.session.execute")
    def test_role_scope_is_bound_as_query_parameters(self, execute):
        count_result = MagicMock()
        count_result.fetchone.return_value = (0,)
        select_result = MagicMock()
        select_result.fetchall.return_value = []
        execute.side_effect = [count_result, select_result]

        User.get_all(allowed_roles={"center_admin", "volunteer"})

        count_query, count_params = execute.call_args_list[0].args
        select_query, select_params = execute.call_args_list[1].args
        self.assertIn("u.role IN (:allowed_role_0, :allowed_role_1)", str(count_query))
        self.assertIn("u.role IN (:allowed_role_0, :allowed_role_1)", str(select_query))
        self.assertEqual(
            {count_params["allowed_role_0"], count_params["allowed_role_1"]},
            {"center_admin", "volunteer"},
        )
        self.assertEqual(
            {select_params["allowed_role_0"], select_params["allowed_role_1"]},
            {"center_admin", "volunteer"},
        )
