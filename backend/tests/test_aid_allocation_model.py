"""Regression tests for allocation model mutation boundaries."""

from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.models.aid_allocation import Allocation
from tests.api_test_case import ApiTestCase


class AllocationModelTests(ApiTestCase):
    def test_update_rejects_unknown_fields_before_loading_allocation(self):
        payload = {"status = 'cancelled' --": "active"}

        with patch("app.models.aid_allocation.Allocation.get_by_id") as get_by_id:
            with self.assertRaisesRegex(
                ValueError, "Unsupported allocation update fields"
            ):
                Allocation.update(1, payload)

        self.assertEqual(payload, {"status = 'cancelled' --": "active"})
        get_by_id.assert_not_called()

    def test_update_binds_only_allowlisted_fields_without_mutating_payload(self):
        payload = {"resource_name": "Water", "status": "cancelled"}
        row = Mock()
        expected = SimpleNamespace(allocation_id=1)

        with self.app.app_context():
            with (
                patch(
                    "app.models.aid_allocation.Allocation.get_by_id",
                    return_value=SimpleNamespace(allocation_id=1),
                ),
                patch(
                    "app.models.aid_allocation.db.session.execute",
                    return_value=Mock(fetchone=Mock(return_value=row)),
                ) as execute,
                patch("app.models.aid_allocation.db.session.commit") as commit,
                patch(
                    "app.models.aid_allocation.Allocation._row_to_allocation",
                    return_value=expected,
                ),
            ):
                result = Allocation.update(1, payload)

        self.assertIs(result, expected)
        self.assertEqual(payload, {"resource_name": "Water", "status": "cancelled"})
        query, parameters = execute.call_args.args
        self.assertIn("resource_name = :resource_name", str(query))
        self.assertIn("status = :status", str(query))
        self.assertEqual(
            parameters,
            {"allocation_id": 1, "resource_name": "Water", "status": "cancelled"},
        )
        commit.assert_called_once_with()
