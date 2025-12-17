from marshmallow import Schema, fields, validate

class DistributionItemSchema(Schema):
    allocation_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))

class CreateDistributionSchema(Schema):
    household_id = fields.Int(required=True)
    items = fields.List(fields.Nested(DistributionItemSchema), required=True, validate=validate.Length(min=1))
    center_id = fields.Int(required=True)
    notes = fields.Str(load_default="")

class DistributionHistoryParams(Schema):
    search = fields.Str(required=False, allow_none=True)
    page = fields.Int(required=False, load_default=1, validate=validate.Range(min=1))
    limit = fields.Int(required=False, load_default=10, validate=validate.Range(min=1, max=100))
    center_id = fields.Int(required=False, allow_none=True)
    
    # NEW: Sorting parameters - FIXED: use load_default instead of default
    sort_by = fields.Str(
        required=False, 
        load_default="distribution_date",
        validate=validate.OneOf([
            "distribution_date", 
            "household_name", 
            "category_name", 
            "resource_name", 
            "quantity", 
            "volunteer_name"
            "status"
        ])
    )
    sort_order = fields.Str(
        required=False, 
        load_default="desc",
        validate=validate.OneOf(["asc", "desc"])
    )

class UpdateDistributionSchema(Schema):
    household_id = fields.Int(required=True)
    allocation_id = fields.Int(required=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    center_id = fields.Int(required=True)
