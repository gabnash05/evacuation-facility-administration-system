"""Marshmallow schemas for stats API validation and serialization."""

from marshmallow import Schema, fields, validate


class StatsFilterSchema(Schema):
    """Schema for stats filter request."""

    gender = fields.String(
        allow_none=True,
        validate=validate.OneOf(
            ["Male", "Female", "Other"],
            error="Gender must be one of: Male, Female, Other",
        ),
    )
    age_group = fields.String(
        allow_none=True,
        validate=validate.OneOf(
            ["Child", "Teen", "Adult", "Senior"],
            error="Age group must be one of: Child, Teen, Adult, Senior",
        ),
    )
    center_id = fields.Integer(allow_none=True)


class OccupancyStatsSchema(Schema):
    """Schema for occupancy utilization rate response."""

    current_occupancy = fields.Integer(dump_only=True)
    total_capacity = fields.Integer(dump_only=True)
    percentage = fields.Float(dump_only=True)


class RegistrationStatsSchema(Schema):
    """Schema for registration penetration response."""

    total_check_ins = fields.Integer(dump_only=True)
    total_registered = fields.Integer(dump_only=True)
    percentage = fields.Float(dump_only=True)


class AidDistributionStatsSchema(Schema):
    """Schema for aid distribution efficiency response."""

    total_distributed = fields.Integer(dump_only=True)
    total_allocated = fields.Integer(dump_only=True)
    percentage = fields.Float(dump_only=True)


class DashboardStatsResponseSchema(Schema):
    """Schema for complete dashboard stats response."""

    occupancy_stats = fields.Nested(OccupancyStatsSchema, dump_only=True)
    registration_stats = fields.Nested(RegistrationStatsSchema, dump_only=True)
    aid_distribution_stats = fields.Nested(AidDistributionStatsSchema, dump_only=True)