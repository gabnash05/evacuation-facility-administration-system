from marshmallow import Schema, fields, validate, ValidationError
from datetime import date 

def validate_not_in_future(value):
    """
    Validator that raises an error if the provided date is in the future.
    """
    if value and value > date.today():
        raise ValidationError("Date of birth cannot be in the future.")

class IndividualCreateSchema(Schema):
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    
    date_of_birth = fields.Date(
        allow_none=True, 
        required=False,
        validate=validate_not_in_future 
    )
    
    gender = fields.Str(allow_none=True, required=False, validate=validate.OneOf(['Male', 'Female', 'Other']))
    relationship_to_head = fields.Str(required=True, validate=validate.Length(min=1, max=50))

class IndividualUpdateSchema(IndividualCreateSchema):
    individual_id = fields.Int(required=False)

class IndividualSelectionSchema(Schema):
    individual_id = fields.Int(dump_only=True)
    first_name = fields.Str(dump_only=True)
    last_name = fields.Str(dump_only=True)
    date_of_birth = fields.Date(dump_only=True, allow_none=True)
    gender = fields.Str(dump_only=True, allow_none=True)
    relationship_to_head = fields.Str(dump_only=True)