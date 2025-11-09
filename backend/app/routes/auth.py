"""Flask routes for authentication operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request, current_app  
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.schemas.user import UserLoginSchema, UserRegisterSchema, UserResponseSchema
from app.services.user_service import authenticate_user, get_current_user, register_user

# Configure logger for this module
logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth_bp", __name__)

# Initialize schemas
login_schema = UserLoginSchema()
register_schema = UserRegisterSchema()
user_response_schema = UserResponseSchema()


@auth_bp.route("/auth/login", methods=["POST"])
def login() -> Tuple:
    """
    Authenticate a user and return JWT token.

    Request Body:
        email (string) - User email
        password (string) - User password

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        try:
            data = login_schema.load(request.get_json())
        except Exception as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Validation error: {str(validation_error)}",
                    }
                ),
                400,
            )

        email = data.get("email")
        password = data.get("password")

        logger.info("Login attempt for email: %s", email)

        # Authenticate user
        auth_result = authenticate_user(email, password)

        if not auth_result["success"]:
            return jsonify({"success": False, "message": auth_result["message"]}), 401

        # Prepare the response data
        response_data = {
            "success": True,
            "message": "Login successful",
            "data": {
                "role": auth_result["role"],
                "token": auth_result["access_token"]  # Include token in response
            },
        }
        response = jsonify(response_data)

        # Set cookie with JWT token
        response.set_cookie(
            "access_token",
            auth_result["access_token"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="Lax",
            max_age=86400,  # 24 hours
            path="/"
        )

        return response, 200

    except Exception as error:
        logger.error("Error during login: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error during authentication",
                }
            ),
            500,
        )


@auth_bp.route("/auth/register", methods=["POST"])
@jwt_required()
def register() -> Tuple:
    """
    Register a new user (City Admin only).

    Header:
        Authorization: Bearer <token>

    Request Body:
        email (string) - User email
        password (string) - User password
        role (string) - User role
        center_id (integer, optional) - Associated center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Validate and deserialize input using Marshmallow schema
        try:
            logger.info("User registration attempt")
            data = register_schema.load(request.get_json())
        except Exception as validation_error:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Validation error: {str(validation_error)}",
                    }
                ),
                400,
            )

        email = data.get("email")
        password = data.get("password")
        role = data.get("role")
        center_id = data.get("center_id")

        # Get current user from JWT to check permissions
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return jsonify({"success": False, "message": "Invalid token"}), 401

        permission_hierarchy = {
            "super_admin": ["super_admin", "city_admin", "center_admin", "volunteer"],
            "city_admin": ["center_admin", "volunteer"],
            "center_admin": [],  # Cannot create users
        }

        if role not in permission_hierarchy.get(current_user.role, []):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Insufficient permissions to create this role",
                    }
                ),
                403,
            )

        logger.info(
            "Registration attempt by user %s for email: %s", current_user_id, email
        )

        # Register new user
        registration_result = register_user(
            email, password, role, center_id, current_user
        )

        if not registration_result["success"]:
            return (
                jsonify({"success": False, "message": registration_result["message"]}),
                400,
            )

        # Get the created user and serialize response
        user = registration_result["user"]
        user_data = user_response_schema.dump(user)

        response = {
            "success": True,
            "message": "User registered successfully",
            "data": user_data,
        }
        return jsonify(response), 201

    except Exception as error:
        logger.error("Error during user registration: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error during registration",
                }
            ),
            500,
        )


@auth_bp.route("/auth/logout", methods=["POST"])
def logout() -> Tuple:
    """
    Logout user by clearing the access token cookie.

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """

    try:
        logger.info("Logout request received")

        response = jsonify({"success": True, "message": "Logout successful"})

        cookie_secure = current_app.config.get("JWT_COOKIE_SECURE", False)

        response.set_cookie(
            "access_token",
            "",
            httponly=True,
            secure=cookie_secure,
            samesite="Lax",
            max_age=0,
            expires=0,
            path="/",  # Ensure cookie path matches login
        )

        return response, 200

    except Exception as error:
        logger.error("Error during logout: %s", str(error))
        return (
            jsonify(
                {"success": False, "message": "Internal server error during logout"}
            ),
            500,
        )


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me() -> Tuple:
    """
    Retrieve current logged-in user information.

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        current_user_id = get_jwt_identity()

        logger.info("Fetching current user info for user ID: %s", current_user_id)

        user = get_current_user(current_user_id)

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Serialize user data using Marshmallow schema
        user_data = user_response_schema.dump(user)

        response = {
            "success": True,
            "message": "User retrieved successfully",
            "data": user_data,
        }
        return jsonify(response), 200

    except Exception as error:
        logger.error("Error fetching current user: %s", str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500
