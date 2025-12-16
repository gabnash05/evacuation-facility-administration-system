"""Marshmallow schemas for stats endpoints validation and serialization."""

from marshmallow import Schema, fields, validate, ValidationError


class StatsFilterSchema(Schema):
    """Schema for validating stats filter query parameters."""
    
    gender = fields.String(
        required=False,
        allow_none=True,
        validate=validate.OneOf(
            ["Male", "Female", "Other"],
            error="Gender must be one of: Male, Female, Other"
        )
    )
    
    age_group = fields.String(
        required=False,
        allow_none=True,
        validate=validate.OneOf(
            ["Child", "Teen", "Adult", "Senior"],
            error="Age group must be one of: Child, Teen, Adult, Senior"
        )
    )
    
    center_id = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(min=1, error="Center ID must be a positive integer")
    )
    
    # NEW: Event ID filter
    event_id = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(min=1, error="Event ID must be a positive integer")
    )


class OccupancyStatsSchema(Schema):
    """Schema for occupancy statistics response."""
    
    current_occupancy = fields.Integer(required=True)
    total_capacity = fields.Integer(required=True)
    percentage = fields.Float(required=True)


class RegistrationStatsSchema(Schema):
    """Schema for registration statistics response."""
    
    total_check_ins = fields.Integer(required=True)
    total_registered = fields.Integer(required=True)
    percentage = fields.Float(required=True)


class AidDistributionStatsSchema(Schema):
    """Schema for aid distribution statistics response."""
    
    total_distributed = fields.Integer(required=True)
    total_allocated = fields.Integer(required=True)
    remaining = fields.Integer(required=True)
    percentage = fields.Float(required=True)


class DashboardStatsDataSchema(Schema):
    """Schema for complete dashboard statistics data."""
    
    occupancy_stats = fields.Nested(OccupancyStatsSchema, required=True)
    registration_stats = fields.Nested(RegistrationStatsSchema, required=True)
    aid_distribution_stats = fields.Nested(AidDistributionStatsSchema, required=True)


class DashboardStatsResponseSchema(Schema):
    """Schema for dashboard statistics API response."""
    
    success = fields.Boolean(required=True)
    data = fields.Nested(DashboardStatsDataSchema, required=False, allow_none=True)
    message = fields.String(required=False, allow_none=True)