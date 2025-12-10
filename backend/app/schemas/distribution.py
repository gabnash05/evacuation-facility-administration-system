from marshmallow import Schema, fields, validate

class DistributionHistoryParams(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    limit = fields.Int(load_default=10, validate=validate.Range(min=1, max=100))
    search = fields.Str(load_default="")
    center_id = fields.Int(allow_none=True)