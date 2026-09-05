"""Regression tests for household and individual validation contracts."""

import unittest
from datetime import date, timedelta

from marshmallow import ValidationError

from app.schemas import household, individual


class HouseholdAndIndividualSchemaTests(unittest.TestCase):
    def test_household_query_applies_stable_pagination_defaults(self):
        data = household.HouseholdQuerySchema().load({})

        self.assertEqual(data["page"], 1)
        self.assertEqual(data["per_page"], 15)
        self.assertEqual(data["sort_by"], "name")
        self.assertEqual(data["sort_direction"], "asc")

    def test_household_creation_with_individuals_requires_a_member(self):
        with self.assertRaises(ValidationError):
            household.HouseholdWithIndividualsCreateSchema().load(
                {
                    "household_name": "Santos household",
                    "address": "Barangay One, City",
                    "center_id": 1,
                    "individuals": [],
                }
            )

    def test_individual_creation_rejects_future_dates_of_birth(self):
        with self.assertRaises(ValidationError):
            individual.IndividualCreateSchema().load(
                {
                    "household_id": 1,
                    "first_name": "Ana",
                    "last_name": "Santos",
                    "date_of_birth": date.today() + timedelta(days=1),
                    "relationship_to_head": "Child",
                }
            )

    def test_individual_creation_requires_a_household_identifier(self):
        with self.assertRaises(ValidationError):
            individual.IndividualCreateSchema().load(
                {
                    "first_name": "Ana",
                    "last_name": "Santos",
                    "relationship_to_head": "Child",
                }
            )

    def test_individual_update_accepts_a_partial_payload(self):
        data = individual.IndividualUpdateSchema().load({"last_name": "Cruz"})

        self.assertEqual(data, {"last_name": "Cruz"})
