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
            with (
                patch("app.models.event.db.session.execute") as execute,
                patch("app.models.event.db.session.commit") as commit,
            ):
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

    def test_event_update_preserves_center_ids_for_the_service_and_association_work(
        self,
    ):
        from app.models.event import Event

        current_event = Mock(status="active")
        updated_event = Mock(event_id=9)
        payload = {"event_name": "Updated event", "center_ids": [2, 3]}
        query_result = Mock()
        query_result.fetchone.return_value = Mock()

        with self.app.app_context():
            with (
                patch("app.models.event.Event.get_by_id", return_value=current_event),
                patch(
                    "app.models.event.db.session.execute", return_value=query_result
                ) as execute,
                patch("app.models.event.db.session.commit") as commit,
                patch(
                    "app.models.event.Event._row_to_event", return_value=updated_event
                ),
                patch("app.models.event.EventCenter.remove_centers") as remove_centers,
                patch("app.models.event.EventCenter.add_centers") as add_centers,
            ):
                result = Event.update(9, payload)

        self.assertIs(result, updated_event)
        self.assertEqual(payload, {"event_name": "Updated event", "center_ids": [2, 3]})
        remove_centers.assert_called_once_with(9)
        add_centers.assert_called_once_with(9, [2, 3])
        self.assertEqual(execute.call_count, 1)
        commit.assert_called_once_with()
