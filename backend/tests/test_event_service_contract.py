"""Regression tests for event service mutation contracts."""

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.event_service import update_event


class EventServiceContractTests(unittest.TestCase):
    def test_center_updates_recalculate_capacity_after_model_update(self):
        existing_event = SimpleNamespace(event_id=4, status="active")
        updated_event = SimpleNamespace(event_id=4, to_schema=lambda: {"event_id": 4})

        with (
            patch(
                "app.services.event_service.Event.get_by_id",
                return_value=existing_event,
            ),
            patch(
                "app.services.event_service.Event.update",
                return_value=updated_event,
            ) as model_update,
            patch(
                "app.services.event_service.Event.recalculate_event_capacity",
                return_value=updated_event,
            ) as recalculate,
        ):
            result = update_event(4, {"center_ids": [2, 3]})

        self.assertTrue(result["success"])
        self.assertEqual(model_update.call_args.args[1], {"center_ids": [2, 3]})
        recalculate.assert_called_once_with(4)
