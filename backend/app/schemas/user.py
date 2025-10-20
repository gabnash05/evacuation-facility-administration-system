"""Marshmallow schemas for user API validation and serialization."""

from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from typing import Optional
from datetime import datetime


class UserLoginSchema(Schema):
    """Schema for user login request."""
    
    email = fields.Email(required=True, description="User email address")
    password = fields.String(required=True, description="User password")


class UserRegisterSchema(Schema):
    """Schema for user registration request."""
    
    email = fields.Email(required=True, description="User email address")
    password = fields.String(
        required=True, 
        validate=validate.Length(min=6, error="Password must be at least 6 characters"),
        description="User password"
    )
    role = fields.String(
        required=True,
        validate=validate.OneOf(
            ["super_admin", "city_admin", "center_admin", "volunteer"],
            error="Role must be one of: super_admin, city_admin, center_admin, volunteer"
        ),
        description="User role"
    )
    center_id = fields.Integer(
        allow_none=True,
        description="Associated center ID (for center_admin and volunteer role)"
    )

    @validates_schema
    def validate_center_requirement(self, data, **kwargs):
        """Validate center_id requirements based on role."""
        role = data.get('role')
        center_id = data.get('center_id')
        
        # Roles that REQUIRE center_id
        if role in ['center_admin', 'volunteer'] and not center_id:
            raise ValidationError('center_id is required for center_admin and volunteer role')
        
        # Roles that MUST NOT have center_id
        if role in ['super_admin', 'city_admin'] and center_id is not None:
            raise ValidationError('center_id must be null for super_admin and city_admin roles')


class UserUpdateSchema(Schema):
    """Schema for updating user information."""
    
    email = fields.Email(allow_none=True, description="User email address")
    role = fields.String(
        allow_none=True,
        validate=validate.OneOf(["super_admin", "city_admin", "center_admin", "volunteer"]),
        description="User role"
    )
    center_id = fields.Integer(
        allow_none=True,
        description="Associated center ID"
    )
    is_active = fields.Boolean(allow_none=True, description="User active status")

    @validates_schema
    def validate_center_requirement(self, data, **kwargs):
        """Validate center_id requirements based on role."""
        role = data.get('role')
        center_id = data.get('center_id')
        
        # Only validate if role is being updated
        if role:
            # Roles that REQUIRE center_id
            if role in ['center_admin', 'volunteer'] and center_id is None:
                raise ValidationError('center_id is required for center_admin and volunteer roles')
            
            # Roles that MUST NOT have center_id
            if role in ['super_admin', 'city_admin'] and center_id is not None:
                raise ValidationError('center_id must be null for super_admin and city_admin roles')

class UserResponseSchema(Schema):
    """Schema for user API responses."""
    
    id = fields.Integer(dump_only=True, description="User ID")
    email = fields.Email(dump_only=True, description="User email address")
    role = fields.String(dump_only=True, description="User role")
    centerId = fields.Integer(
        allow_none=True,
        dump_only=True,
        attribute="center_id",
        description="Associated center ID"
    )
    isActive = fields.Boolean(
        dump_only=True,
        attribute="is_active", 
        description="User active status"
    )
    createdAt = fields.DateTime(
        dump_only=True,
        attribute="created_at",
        description="User creation timestamp"
    )


class LoginResponseSchema(Schema):
    """Schema for login API response."""
    
    access_token = fields.String(dump_only=True, description="JWT access token")
    role = fields.String(dump_only=True, description="User role")


class UserListResponseSchema(Schema):
    """Schema for paginated user list response."""
    
    success = fields.Boolean(dump_only=True, description="Request success status")
    message = fields.String(dump_only=True, description="Response message")
    data = fields.Dict(dump_only=True, description="Response data")