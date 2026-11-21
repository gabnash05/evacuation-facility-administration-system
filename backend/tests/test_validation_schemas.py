"""Regression tests for center, event, and dashboard validation contracts."""

import unittest

from marshmallow import ValidationError

from app.schemas import evacuation_center
from app.schemas.event import EventCreateSchema
from app.schemas.stats import StatsFilterSchema


class ValidationSchemaTests(unittest.TestCase):
    def test_center_create_applies_documented_defaults(self):
        data = evacuation_center.EvacuationCenterCreateSchema().load(
            {
                "center_name": "North Hall",
                "address": "Barangay One",
                "latitude": 14.6,
                "longitude": 121.0,
                "capacity": 100,
            }
        )

        self.assertEqual(data["current_occupancy"], 0)
        self.assertEqual(data["status"], "active")

    def test_center_update_requires_coordinate_pairs(self):
        with self.assertRaises(ValidationError):
            evacuation_center.EvacuationCenterUpdateSchema().load({"latitude": 14.6})

    def test_event_create_normalizes_supported_display_dates(self):
        data = EventCreateSchema().load(
            {
                "event_name": "Flood response",
                "event_type": "flood",
                "date_declared": "04/09/2026",
            }
        )

        self.assertEqual(data["date_declared"], "2026-09-04")
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["center_ids"], [])

    def test_dashboard_filters_reject_non_positive_center_identifiers(self):
        with self.assertRaises(ValidationError):
            StatsFilterSchema().load({"center_id": 0})
