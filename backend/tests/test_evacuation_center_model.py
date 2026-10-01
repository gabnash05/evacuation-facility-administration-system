"""Regression tests for evacuation-center model normalization."""

import unittest

from app.models.evacuation_center import EvacuationCenter


class EvacuationCenterModelTests(unittest.TestCase):
    def test_parse_coordinates_accepts_supported_string_and_sequence_inputs(self):
        self.assertEqual(
            EvacuationCenter._parse_coordinates("(124.63, 8.23)"), (124.63, 8.23)
        )
        self.assertEqual(
            EvacuationCenter._parse_coordinates([124.63, 8.23]), (124.63, 8.23)
        )

    def test_parse_coordinates_rejects_malformed_or_incomplete_values(self):
        self.assertEqual(
            EvacuationCenter._parse_coordinates("not coordinates"), (None, None)
        )
        self.assertEqual(EvacuationCenter._parse_coordinates([124.63]), (None, None))
