"""Marshmallow schemas for evacuation center API validation and serialization."""

from marshmallow import Schema, ValidationError, fields, validate, validates_schema, post_dump


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
    latitude = fields.Float(
        required=True,
        validate=validate.Range(
            min=-90, max=90, error="Latitude must be between -90 and 90 degrees"
        ),
    )
    longitude = fields.Float(
        required=True,
        validate=validate.Range(
            min=-180, max=180, error="Longitude must be between -180 and 180 degrees"
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
    
    @validates_schema
    def validate_coordinates(self, data, **kwargs):
        """Validate that coordinates are plausible geographic coordinates."""
        if 'latitude' in data and 'longitude' in data:
            # Simple validation for plausible locations
            lat = data['latitude']
            lng = data['longitude']
            
            # Check for unrealistic precision (optional)
            if abs(lat) > 90 or abs(lng) > 180:
                raise ValidationError("Invalid coordinate values")


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
    latitude = fields.Float(
        allow_none=True,
        validate=validate.Range(
            min=-90, max=90, error="Latitude must be between -90 and 90 degrees"
        ),
    )
    longitude = fields.Float(
        allow_none=True,
        validate=validate.Range(
            min=-180, max=180, error="Longitude must be between -180 and 180 degrees"
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
    
    @validates_schema
    def validate_coordinate_pair(self, data, **kwargs):
        """Ensure both latitude and longitude are provided together or not at all."""
        lat_provided = 'latitude' in data and data['latitude'] is not None
        lng_provided = 'longitude' in data and data['longitude'] is not None
        
        if lat_provided != lng_provided:
            raise ValidationError(
                "Both latitude and longitude must be provided together"
            )


class EvacuationCenterResponseSchema(Schema):
    """Schema for evacuation center API responses."""

    center_id = fields.Integer(dump_only=True)
    center_name = fields.String(dump_only=True)
    address = fields.String(dump_only=True)
    latitude = fields.Method("get_latitude", dump_only=True)
    longitude = fields.Method("get_longitude", dump_only=True)
    capacity = fields.Integer(dump_only=True)
    current_occupancy = fields.Integer(dump_only=True)
    status = fields.String(dump_only=True)
    photo_data = fields.String(dump_only=True)  # Return base64 string
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_latitude(self, obj):
        """Extract latitude from coordinates."""
        if hasattr(obj, 'latitude'):
            return obj.latitude
        elif hasattr(obj, 'coordinates'):
            # Handle extraction from coordinates if needed
            return None  # You'll need to implement based on your data structure
        return None

    def get_longitude(self, obj):
        """Extract longitude from coordinates."""
        if hasattr(obj, 'longitude'):
            return obj.longitude
        elif hasattr(obj, 'coordinates'):
            # Handle extraction from coordinates if needed
            return None  # You'll need to implement based on your data structure
        return None


class EvacuationCenterListResponseSchema(Schema):
    """Schema for paginated evacuation center list response."""

    success = fields.Boolean(dump_only=True)
    message = fields.String(dump_only=True)
    data = fields.Dict(dump_only=True)