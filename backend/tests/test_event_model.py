"""Regression tests for event persistence lifecycle behavior."""

from unittest.mock import Mock, patch

from app.models.event import EventCenter
from tests.api_test_case import ApiTestCase


class EventCenterModelTests(ApiTestCase):
    def test_removing_all_centers_reads_associations_before_deleting_them(self):
        associated_centers = Mock()
        associated_centers.fetchall.return_value = [(2,), (3,)]
        delete_result = Mock()
        no_remaining_active_event = Mock()
        no_remaining_active_event.scalar.return_value = 0
        update_result = Mock()
        other_active_event = Mock()
        other_active_event.scalar.return_value = 1

        with self.app.app_context():
            with patch("app.models.event.db.session.execute") as execute, patch(
                "app.models.event.db.session.commit"
            ) as commit:
                execute.side_effect = [
                    associated_centers,
                    delete_result,
                    no_remaining_active_event,
                    update_result,
                    other_active_event,
                ]

                EventCenter.remove_centers(9)

        first_query, first_params = execute.call_args_list[0].args
        second_query, second_params = execute.call_args_list[1].args
        self.assertIn("SELECT center_id FROM event_centers", str(first_query))
        self.assertEqual(first_params, {"event_id": 9})
        self.assertIn("DELETE FROM event_centers", str(second_query))
        self.assertEqual(second_params, {"event_id": 9})
        update_query, update_params = execute.call_args_list[3].args
        self.assertIn("SET status = 'inactive'", str(update_query))
        self.assertEqual(update_params, {"center_id": 2})
        self.assertEqual(execute.call_count, 5)
        commit.assert_called_once_with()
