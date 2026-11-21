"""Regression tests for evacuation-center model normalization."""

import unittest
from unittest.mock import patch

from app.models.evacuation_center import EvacuationCenter


class EvacuationCenterModelTests(unittest.TestCase):
    @patch("app.models.evacuation_center.db")
    @patch.object(EvacuationCenter, "_row_to_center")
    def test_update_binds_coordinate_values(self, convert, database):
        EvacuationCenter.update(4, {"longitude": 124.6, "latitude": 8.2})

        query, params = database.session.execute.call_args.args
        self.assertIn("POINT(:longitude, :latitude)", str(query))
        self.assertEqual(params["longitude"], 124.6)
        self.assertEqual(params["latitude"], 8.2)
        database.session.commit.assert_called_once_with()

    @patch("app.models.evacuation_center.db")
    def test_update_rejects_untrusted_sql_identifier_before_database_access(
        self, database
    ):
        with self.assertRaisesRegex(ValueError, "Unsupported evacuation center"):
            EvacuationCenter.update(1, {"status = 'active' --": "ignored"})

        database.session.execute.assert_not_called()

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
