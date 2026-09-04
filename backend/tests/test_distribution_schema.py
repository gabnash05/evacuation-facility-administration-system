"""Regression tests for distribution request validation contracts."""

import unittest

from marshmallow import ValidationError

from app.schemas import distribution


class DistributionSchemaTests(unittest.TestCase):
    def test_create_distribution_applies_empty_notes_default(self):
        data = distribution.CreateDistributionSchema().load(
            {
                "household_id": 4,
                "center_id": 2,
                "items": [{"allocation_id": 8, "quantity": 3}],
            }
        )

        self.assertEqual(data["notes"], "")
        self.assertEqual(data["items"][0]["quantity"], 3)

    def test_distribution_items_reject_non_positive_quantities(self):
        with self.assertRaises(ValidationError):
            distribution.CreateDistributionSchema().load(
                {
                    "household_id": 4,
                    "center_id": 2,
                    "items": [{"allocation_id": 8, "quantity": 0}],
                }
            )

    def test_history_query_applies_stable_pagination_and_sort_defaults(self):
        data = distribution.DistributionHistoryParams().load({})

        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], 10)
        self.assertEqual(data["sort_by"], "distribution_date")
        self.assertEqual(data["sort_order"], "desc")
