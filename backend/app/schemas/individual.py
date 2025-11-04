# FILE NAME: app/schemas/individual.py

from marshmallow import Schema, fields, validate

class IndividualCreateSchema(Schema):
    """
    Schema for validating a new individual when creating a household.
    """
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    relationship_to_head = fields.Str(required=True, validate=validate.Length(min=1, max=50))

class IndividualUpdateSchema(IndividualCreateSchema):
    """
    Schema for updating/creating an individual within a household update.
    ID is optional because new members won't have one.
    """
    individual_id = fields.Int(required=False)

# --- THIS IS THE CORRECTED SCHEMA ---
class IndividualSelectionSchema(Schema):
    """
    A simple schema for populating selection dropdowns and lists.
    """
    individual_id = fields.Int(dump_only=True)
    first_name = fields.Str(dump_only=True)
    last_name = fields.Str(dump_only=True)
    # This is the crucial missing line that fixes the bug.
    relationship_to_head = fields.Str(dump_only=True)