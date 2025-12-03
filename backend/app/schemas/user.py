"""Marshmallow schemas for user API validation and serialization."""

from marshmallow import Schema, ValidationError, fields, validate, validates_schema


class UserLoginSchema(Schema):
    """Schema for user login request."""

    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserRegisterSchema(Schema):
    """Schema for user registration request."""

    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        validate=validate.Length(min=6, error="Password must be at least 6 characters"),
    )
    role = fields.String(
        required=True,
        validate=validate.OneOf(
            ["super_admin", "city_admin", "center_admin", "volunteer"],
            error="Role must be one of: super_admin, city_admin, center_admin, volunteer",
        ),
    )
    center_id = fields.Integer(allow_none=True)

    @validates_schema
    def validate_center_requirement(self, data, **kwargs):
        """Validate center_id requirements based on role."""
        role = data.get("role")
        center_id = data.get("center_id")

        # Roles that REQUIRE center_id
        if role in ["center_admin", "volunteer"] and not center_id:
            raise ValidationError(
                "center_id is required for center_admin and volunteer role"
            )

        # Roles that MUST NOT have center_id
        if role in ["super_admin", "city_admin"] and center_id is not None:
            raise ValidationError(
                "center_id must be null for super_admin and city_admin roles"
            )


class UserCreateSchema(Schema):
    """Schema for user creation request (user management)."""

    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        validate=validate.Length(min=6, error="Password must be at least 6 characters"),
    )
    role = fields.String(
        required=True,
        validate=validate.OneOf(
            ["super_admin", "city_admin", "center_admin", "volunteer"],
            error="Role must be one of: super_admin, city_admin, center_admin, volunteer",
        ),
    )
    center_id = fields.Integer(allow_none=True)

    @validates_schema
    def validate_center_requirement(self, data, **kwargs):
        """Validate center_id requirements based on role."""
        role = data.get("role")
        center_id = data.get("center_id")

        # Roles that REQUIRE center_id
        if role in ["center_admin", "volunteer"] and not center_id:
            raise ValidationError(
                "center_id is required for center_admin and volunteer roles"
            )

        # Roles that MUST NOT have center_id
        if role in ["super_admin", "city_admin"] and center_id is not None:
            raise ValidationError(
                "center_id must be null for super_admin and city_admin roles"
            )


class UserUpdateSchema(Schema):
    """Schema for updating user information."""

    email = fields.Email(allow_none=True)
    # ADDED: Allow password update
    password = fields.String(
        allow_none=True, 
        validate=validate.Length(min=6, error="Password must be at least 6 characters")
    )
    role = fields.String(
        allow_none=True,
        validate=validate.OneOf(
            ["super_admin", "city_admin", "center_admin", "volunteer"]
        ),
    )
    center_id = fields.Integer(allow_none=True)
    is_active = fields.Boolean(allow_none=True)

    @validates_schema
    def validate_center_requirement(self, data, **kwargs):
        """Validate center_id requirements based on role."""
        role = data.get("role")
        center_id = data.get("center_id")

        # Only validate if role is being updated
        if role:
            # Roles that REQUIRE center_id
            if role in ["center_admin", "volunteer"] and center_id is None:
                raise ValidationError(
                    "center_id is required for center_admin and volunteer roles"
                )

            # Roles that MUST NOT have center_id
            if role in ["super_admin", "city_admin"] and center_id is not None:
                raise ValidationError(
                    "center_id must be null for super_admin and city_admin roles"
                )


class UserResponseSchema(Schema):
    """Schema for user response data."""

    user_id = fields.Int(dump_only=True)
    email = fields.Str(required=True)
    role = fields.Str(required=True)
    center_id = fields.Int(allow_none=True)
    is_active = fields.Bool(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    center_name = fields.Str(allow_none=True, dump_only=True)  # Add this line

    class Meta:
        ordered = True


class LoginResponseSchema(Schema):
    """Schema for login API response."""

    access_token = fields.String(dump_only=True)
    role = fields.String(dump_only=True)


class UserListResponseSchema(Schema):
    """Schema for paginated user list response."""

    success = fields.Boolean(dump_only=True)
    message = fields.String(dump_only=True)
    data = fields.Dict(dump_only=True)
