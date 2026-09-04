"""Regression coverage for configured authentication cookie logout behavior."""

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
