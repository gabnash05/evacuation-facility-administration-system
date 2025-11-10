"""Marshmallow schemas for evacuation center API validation and serialization."""

from marshmallow import Schema, ValidationError, fields, validate, validates_schema


class EvacuationCenterCreateSchema(Schema):
    """Schema for evacuation center creation request."""

    center_name = fields.String(
        required=True,
        validate=validate.Length(
            min=1, max=255, error="Center name must be between 1 and 255 characters"
        ),
    )
    address = fields.String(
        required=True,
        validate=validate.Length(
            min=1, max=255, error="Address must be between 1 and 255 characters"
        ),
    )
    capacity = fields.Integer(
        required=True,
        validate=validate.Range(
            min=1, max=10000, error="Capacity must be between 1 and 10000"
        ),
    )
    current_occupancy = fields.Integer(
        load_default=0,
        validate=validate.Range(min=0, error="Current occupancy cannot be negative"),
    )
    status = fields.String(
        load_default="active",
        validate=validate.OneOf(
            ["active", "inactive", "closed"],
            error="Status must be one of: active, inactive, closed",
        ),
    )
    photo_data = fields.String(required=False)  # For base64 image data


class EvacuationCenterUpdateSchema(Schema):
    """Schema for updating evacuation center information."""

    center_name = fields.String(
        allow_none=True,
        validate=validate.Length(
            min=1, max=255, error="Center name must be between 1 and 255 characters"
        ),
    )
    address = fields.String(
        allow_none=True,
        validate=validate.Length(
            min=1, max=255, error="Address must be between 1 and 255 characters"
        ),
    )
    capacity = fields.Integer(
        allow_none=True,
        validate=validate.Range(
            min=1, max=10000, error="Capacity must be between 1 and 10000"
        ),
    )
    current_occupancy = fields.Integer(
        allow_none=True,
        validate=validate.Range(min=0, error="Current occupancy cannot be negative"),
    )
    status = fields.String(
        allow_none=True,
        validate=validate.OneOf(
            ["active", "inactive", "closed"],
            error="Status must be one of: active, inactive, closed",
        ),
    )
    photo_data = fields.String(allow_none=True)  # This must allow None values


class EvacuationCenterResponseSchema(Schema):
    """Schema for evacuation center API responses."""

    center_id = fields.Integer(dump_only=True)
    center_name = fields.String(dump_only=True)
    address = fields.String(dump_only=True)
    capacity = fields.Integer(dump_only=True)
    current_occupancy = fields.Integer(dump_only=True)
    status = fields.String(dump_only=True)
    photo_data = fields.String(dump_only=True)  # Return base64 string
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class EvacuationCenterListResponseSchema(Schema):
    """Schema for paginated evacuation center list response."""

    success = fields.Boolean(dump_only=True)
    message = fields.String(dump_only=True)
    data = fields.Dict(dump_only=True)
