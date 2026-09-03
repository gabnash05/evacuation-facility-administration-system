"""Regression tests for safe allocation-update payload handling."""

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services import aid_allocation_service


class AllocationUpdateTests(unittest.TestCase):
    def test_malicious_update_key_is_rejected_before_allocation_lookup(self):
        payload = {"status = 'cancelled' --": "active"}

        with patch(
            "app.services.aid_allocation_service.Allocation.get_by_id"
        ) as get_by_id:
            result = aid_allocation_service.update_allocation(1, payload)

        self.assertEqual(
            result,
            {"success": False, "message": "Unsupported allocation update fields"},
        )
        self.assertEqual(payload, {"status = 'cancelled' --": "active"})
        get_by_id.assert_not_called()

    def test_direct_remaining_quantity_update_is_rejected_before_allocation_lookup(
        self,
    ):
        with patch(
            "app.services.aid_allocation_service.Allocation.get_by_id"
        ) as get_by_id:
            result = aid_allocation_service.update_allocation(
                1, {"remaining_quantity": 1}
            )

        self.assertEqual(
            result,
            {"success": False, "message": "Unsupported allocation update fields"},
        )
        get_by_id.assert_not_called()

    def test_validated_update_data_returns_a_copy_in_allowlist_order(self):
        payload = {"status": "cancelled", "resource_name": "Water"}

        update_data = aid_allocation_service._validated_allocation_update_data(payload)

        self.assertEqual(update_data, {"resource_name": "Water", "status": "cancelled"})
        self.assertIsNot(update_data, payload)
        self.assertEqual(payload, {"status": "cancelled", "resource_name": "Water"})

    def test_remaining_quantity_is_derived_from_persisted_totals(self):
        self.assertEqual(
            aid_allocation_service._derived_remaining_quantity(100, 60, 120), 80
        )
        self.assertEqual(
            aid_allocation_service._derived_remaining_quantity(100, 60, 90), 50
        )

    def test_total_update_binds_server_derived_remaining_quantity(self):
        current_allocation = SimpleNamespace(total_quantity=100, remaining_quantity=60)
        updated_allocation = SimpleNamespace(to_dict=lambda: {"allocation_id": 1})
        query_result = MagicMock()
        query_result.fetchone.return_value = object()

        with (
            patch(
                "app.services.aid_allocation_service.Allocation.get_by_id",
                return_value=current_allocation,
            ),
            patch(
                "app.services.aid_allocation_service.Allocation._row_to_allocation",
                return_value=updated_allocation,
            ),
            patch(
                "app.services.aid_allocation_service.db.session.execute",
                return_value=query_result,
            ) as execute,
            patch("app.services.aid_allocation_service.db.session.commit"),
            patch("app.services.aid_allocation_service.refresh_allocation_status"),
        ):
            result = aid_allocation_service.update_allocation(
                1, {"total_quantity": 120}
            )

        self.assertTrue(result["success"])
        query, params = execute.call_args.args
        self.assertIn("total_quantity = :total_quantity", str(query))
        self.assertIn("remaining_quantity = :remaining_quantity", str(query))
        self.assertEqual(params["total_quantity"], 120)
        self.assertEqual(params["remaining_quantity"], 80)

    def test_total_cannot_drop_below_persisted_remaining_quantity(self):
        with self.assertRaisesRegex(
            ValueError,
            r"Total quantity \(59\) cannot be less than remaining quantity \(60\)",
        ):
            aid_allocation_service._derived_remaining_quantity(100, 60, 59)
