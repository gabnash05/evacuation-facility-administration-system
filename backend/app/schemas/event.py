from marshmallow import Schema, fields, validate, pre_load
from datetime import datetime

class EventCreateSchema(Schema):
    event_name = fields.String(required=True, validate=validate.Length(min=1))
    event_type = fields.String(required=True, validate=validate.Length(min=1))
    date_declared = fields.String(required=True)
    end_date = fields.String(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(["active", "resolved", "monitoring"]),
        load_default="active"
    )

    @pre_load
    def convert_dates(self, data, **kwargs):
        """Convert DD/MM/YYYY to YYYY-MM-DD format"""
        for field in ['date_declared', 'end_date']:
            if field in data and data[field] and data[field] not in ['NA', 'N/A', '']:
                try:
                    date_obj = datetime.strptime(data[field], "%d/%m/%Y")
                    data[field] = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        return data


class EventResponseSchema(Schema):
    event_id = fields.Integer()
    event_name = fields.String()
    event_type = fields.String()
    date_declared = fields.DateTime()
    end_date = fields.DateTime(allow_none=True)
    status = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class EventCenterSchema(Schema):
    center_id = fields.Integer()
    center_name = fields.String()
    barangay = fields.String()
    capacity = fields.Integer()
    current_occupancy = fields.Integer()
    occupancy = fields.Method("get_occupancy", dump_only=True)

    def get_occupancy(self, obj):
        capacity = obj.get("capacity", 0)
        current = obj.get("current_occupancy", 0)
        if capacity > 0:
            percent = int((current / capacity) * 100)
            return f"{percent}%"
        return "0%"


class EventDetailsSchema(Schema):
    event_id = fields.Integer()
    event_name = fields.String()
    event_type = fields.String()
    status = fields.String()
    centers = fields.List(fields.Nested(EventCenterSchema))


class AddCenterSchema(Schema):
    center_id = fields.Integer(required=True)
