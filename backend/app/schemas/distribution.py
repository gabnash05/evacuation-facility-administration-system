from marshmallow import Schema, fields, validate

class DistributionItemSchema(Schema):
    allocation_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))

class CreateDistributionSchema(Schema):
    household_id = fields.Int(required=True)
    # The modal sends an array of items: [{allocationId: 1, quantity: 2}]
    items = fields.List(fields.Nested(DistributionItemSchema), required=True, validate=validate.Length(min=1))
    notes = fields.Str(load_default="")

class DistributionHistoryParams(Schema):
    page = fields.Int(load_default=1)
    limit = fields.Int(load_default=10)
    search = fields.Str(load_default="")
    center_id = fields.Int(allow_none=True)

class UpdateDistributionSchema(Schema):
    quantity = fields.Int(required=True, validate=validate.Range(min=1))