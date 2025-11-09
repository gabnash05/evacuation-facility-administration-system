from marshmallow import Schema, fields, validate, pre_load, post_dump
from datetime import datetime


class EventCreateSchema(Schema):
    event_name = fields.String(required=True, validate=validate.Length(min=1))
    event_type = fields.String(required=True, validate=validate.Length(min=1))
    date_declared = fields.String(required=True)
    end_date = fields.String(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(["active", "resolved", "monitoring"]),
        load_default="active",
    )
    center_ids = fields.List(fields.Integer(), load_default=[])

    @pre_load
    def convert_dates(self, data, **kwargs):
        """Convert DD/MM/YYYY to YYYY-MM-DD format"""
        for field in ["date_declared", "end_date"]:
            if field in data and data[field] and data[field] not in ["NA", "N/A", ""]:
                try:
                    date_obj = datetime.strptime(data[field], "%d/%m/%Y")
                    data[field] = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        return data


class EventUpdateSchema(Schema):
    """Schema for updating events - all fields optional"""

    event_name = fields.String(validate=validate.Length(min=1))
    event_type = fields.String(validate=validate.Length(min=1))
    date_declared = fields.String()
    end_date = fields.String(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(["active", "resolved", "monitoring"])
    )
    center_ids = fields.List(fields.Int(), required=False)


class EventResponseSchema(Schema):
    event_id = fields.Integer()
    event_name = fields.String()
    event_type = fields.String()
    date_declared = fields.String()  # Changed from DateTime to String to match usage
    end_date = fields.String(allow_none=True)  # Changed from DateTime to String
    status = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class EventCenterSchema(Schema):
    center_id = fields.Integer()
    center_name = fields.String()
    address = fields.String()  # Changed from barangay to address to match service usage
    capacity = fields.Integer()
    current_occupancy = fields.Integer()
    occupancy = fields.String()  # Simplified - service calculates this as string


class EventDetailsSchema(Schema):
    event_id = fields.Integer()
    event_name = fields.String()
    event_type = fields.String()
    status = fields.String()
    date_declared = fields.String()  # Added to match service usage
    end_date = fields.String(allow_none=True)  # Added to match service usage
    centers = fields.List(fields.Nested(EventCenterSchema))


class AddCenterSchema(Schema):
    center_id = fields.Integer(required=True)


class EventListResponseSchema(Schema):
    """Schema for paginated event list response"""

    success = fields.Boolean(dump_only=True)
    message = fields.String(dump_only=True)
    data = fields.Dict(dump_only=True)


class EventPaginationSchema(Schema):
    """Schema for pagination metadata"""

    current_page = fields.Integer()
    total_pages = fields.Integer()
    total_items = fields.Integer()
    limit = fields.Integer()


class EventListDataSchema(Schema):
    """Schema for event list data structure"""

    results = fields.List(fields.Nested(EventResponseSchema))
    pagination = fields.Nested(EventPaginationSchema)
