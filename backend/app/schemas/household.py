from marshmallow import Schema, fields, validate

class HouseholdQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=15, validate=validate.Range(min=1, max=100))
    search = fields.Str(load_default="")

    sort_by = fields.Str(
        load_default="name",
        validate=validate.OneOf(["name", "head", "address", "evacCenter"])
    )
    sort_direction = fields.Str(
        load_default="asc",
        validate=validate.OneOf(["asc", "desc"])
    )

class HouseholdResponseSchema(Schema):
    household_id = fields.Int(dump_only=True)
    name = fields.Str(dump_only=True)
    head = fields.Str(dump_only=True)
    address = fields.Str(dump_only=True)
    evacCenter = fields.Str(dump_only=True)

class HouseholdListResponseSchema(Schema):
    data = fields.List(fields.Nested(HouseholdResponseSchema), dump_only=True)
    pagination = fields.Dict(keys=fields.Str(), values=fields.Int(), dump_only=True)