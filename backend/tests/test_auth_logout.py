"""Regression coverage for configured authentication cookie behavior."""

from unittest.mock import patch

from tests.api_test_case import ApiTestCase


class AuthLogoutTests(ApiTestCase):
    def test_logout_clears_the_cookie_with_the_configured_secure_attribute(self):
        self.app.config["JWT_COOKIE_SECURE"] = True

        response = self.client.post("/api/auth/logout")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"success": True, "message": "Logout successful"})
        cookie = response.headers["Set-Cookie"]
        self.assertIn("access_token=", cookie)
        self.assertIn("Max-Age=0", cookie)
        self.assertIn("Secure", cookie)
        self.assertIn("HttpOnly", cookie)

    @patch("app.routes.auth.authenticate_user")
    @patch("app.routes.auth.logger.info")
    def test_login_does_not_log_the_submitted_email(self, logger_info, authenticate_user):
        authenticate_user.return_value = {
            "success": False,
            "message": "Invalid credentials",
        }

        response = self.client.post(
            "/api/auth/login",
            json={"email": "private@example.test", "password": "secret123"},
        )

        self.assertEqual(response.status_code, 401)
        logger_info.assert_called_once_with("Login attempt received")
