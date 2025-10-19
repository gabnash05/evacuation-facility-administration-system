"""Flask routes for authentication operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.user_service import (
    authenticate_user,
    register_user,
    get_current_user
)
from app.schemas.user import (
    UserLoginSchema,
    UserRegisterSchema,
    UserResponseSchema
)
# Configure logger for this module
logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth_bp", __name__)

# Initialize schemas
login_schema = UserLoginSchema()
register_schema = UserRegisterSchema()
user_response_schema = UserResponseSchema()


@auth_bp.route("/api/auth/login", methods=["POST"])
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
            return jsonify({
                "success": False,
                "message": f"Validation error: {str(validation_error)}"
            }), 400
        
        email = data.get("email")
        password = data.get("password")
        
        logger.info("Login attempt for email: %s", email)
        
        # Authenticate user
        auth_result = authenticate_user(email, password)
        
        if not auth_result["success"]:
            return jsonify({
                "success": False,
                "message": auth_result["message"]
            }), 401
        
        response_data = {
            "success": True,
            "message": "Login successful",
            "data": {
                "role": auth_result["role"]
            }
        }

        response = jsonify(response_data)       
         
        # Set httpOnly cookie
        response.set_cookie(
            'access_token', 
            auth_result["access_token"], 
            httponly=True, 
            secure=True,  # Use True in production
            samesite='Lax',
            max_age=86400  # 1 day
        )

        return response, 200
        
    except Exception as error:
        logger.error("Error during login: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Internal server error during authentication"
        }), 500


@auth_bp.route("/api/auth/register", methods=["POST"])
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
            data = register_schema.load(request.get_json())
        except Exception as validation_error:
            return jsonify({
                "success": False,
                "message": f"Validation error: {str(validation_error)}"
            }), 400
        
        email = data.get("email")
        password = data.get("password")
        role = data.get("role")
        center_id = data.get("center_id")
        
        # Get current user from JWT to check permissions
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        if not current_user:
            return jsonify({
                "success": False,
                "message": "Invalid token"
            }), 401
        
        if current_user.role != "city_admin" or role != "super_admin":
            return jsonify({
                "success": False,
                "message": "Insufficient permissions"
            }), 403
        
        logger.info("Registration attempt by user %s for email: %s", current_user_id, email)
        
        # Register new user
        registration_result = register_user(email, password, role, center_id, current_user)
        
        if not registration_result["success"]:
            return jsonify({
                "success": False,
                "message": registration_result["message"]
            }), 400
        
        # Get the created user and serialize response
        user = registration_result["user"]
        user_data = user_response_schema.dump(user)
        
        response = {
            "success": True,
            "message": "User registered successfully",
            "data": user_data
        }
        return jsonify(response), 201
        
    except Exception as error:
        logger.error("Error during user registration: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Internal server error during registration"
        }), 500


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_me() -> Tuple:
    """
    Retrieve current logged-in user information.
    
    Header:
        Authorization: Bearer <token>
    
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
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        # Serialize user data using Marshmallow schema
        user_data = user_response_schema.dump(user)
        
        response = {
            "success": True,
            "message": "User retrieved successfully",
            "data": user_data
        }
        return jsonify(response), 200
        
    except Exception as error:
        logger.error("Error fetching current user: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500
    

# TODO: Logout Route