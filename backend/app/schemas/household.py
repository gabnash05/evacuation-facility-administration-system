from marshmallow import Schema, fields, validate
from app.schemas.individual import IndividualCreateSchema, IndividualUpdateSchema

class HouseholdQuerySchema(Schema):
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    per_page = fields.Int(load_default=15, validate=validate.Range(min=1, max=100))
    search = fields.Str(load_default="")
    sort_by = fields.Str(load_default="name", validate=validate.OneOf(["name", "head", "address", "evacCenter"]))
    sort_direction = fields.Str(load_default="asc", validate=validate.OneOf(["asc", "desc"]))

class HouseholdCreateSchema(Schema):
    household_name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    address = fields.Str(required=True, validate=validate.Length(min=5, max=255))
    center_id = fields.Int(required=True, validate=validate.Range(min=1))

class HouseholdUpdateSchema(Schema):
    household_name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    address = fields.Str(required=True, validate=validate.Length(min=5, max=255))
    center_id = fields.Int(required=True, validate=validate.Range(min=1))
    household_head_id = fields.Int(allow_none=True, required=False)
    individuals = fields.List(fields.Nested(IndividualUpdateSchema), required=False)

class HouseholdWithIndividualsCreateSchema(HouseholdCreateSchema):
    individuals = fields.List(fields.Nested(IndividualCreateSchema), required=True, validate=validate.Length(min=1))

class HouseholdResponseSchema(Schema):
    household_id = fields.Int(dump_only=True)
    
    name = fields.Str(dump_only=True)
    
    head = fields.Str(dump_only=True)
    address = fields.Str(dump_only=True)
    evacCenter = fields.Str(dump_only=True)
    center_id = fields.Int(dump_only=True)
    household_head_id = fields.Int(dump_only=True, allow_none=True)

class HouseholdListResponseSchema(Schema):
    data = fields.List(fields.Nested(HouseholdResponseSchema), dump_only=True)
    pagination = fields.Dict(keys=fields.Str(), values=fields.Int(), dump_only=True)