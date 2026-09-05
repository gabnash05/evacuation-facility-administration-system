"""Regression tests for event creation lifecycle gating."""

from types import SimpleNamespace
from unittest.mock import patch

from tests.api_test_case import ApiTestCase


def super_admin():
    return SimpleNamespace(role="super_admin", center_id=None, is_active=True)


class EventRouteLifecycleTests(ApiTestCase):
    @patch("app.routes.events.get_current_user", return_value=super_admin())
    @patch("app.routes.events.create_event")
    @patch("app.models.event.Event.get_all")
    def test_non_active_event_can_be_created_while_an_active_event_exists(
        self, get_all, create_event, get_current_user
    ):
        create_event.return_value = {"success": True, "data": {"event_id": 2}}

        response = self.client.post(
            "/api/events",
            headers=self.authorization_headers(1),
            json={
                "event_name": "Monitoring event",
                "event_type": "Typhoon",
                "date_declared": "2026-09-05",
                "status": "monitoring",
            },
        )

        self.assertEqual(response.status_code, 201)
        get_all.assert_not_called()
        create_event.assert_called_once()

    @patch("app.routes.events.get_current_user", return_value=super_admin())
    @patch("app.routes.events.create_event")
    @patch("app.models.event.Event.get_all")
    def test_active_event_is_rejected_when_an_active_event_exists(
        self, get_all, create_event, get_current_user
    ):
        get_all.return_value = {"total_count": 1}

        response = self.client.post(
            "/api/events",
            headers=self.authorization_headers(1),
            json={
                "event_name": "Active event",
                "event_type": "Typhoon",
                "date_declared": "2026-09-05",
                "status": "active",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already an active event", response.get_json()["message"])
        get_all.assert_called_once_with(status="active")
        create_event.assert_not_called()
