"""Flask routes for user management operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.user_service import (
    create_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user,
    deactivate_user_service,
    reactivate_user_service,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users() -> Tuple:
    """
    Get all users with filtering, pagination, and sorting.

    Query Parameters:
        search (string) - Search in email
        role (string) - Filter by role
        status (string) - Filter by status (active/inactive)
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sortBy (string) - Field to sort by
        sortOrder (string) - Sort direction (asc/desc)
        center_id (string) - Filter by center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters
        search = request.args.get("search", type=str)
        role = request.args.get("role", type=str)
        status = request.args.get("status", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sortBy", type=str)
        sort_order = request.args.get("sortOrder", type=str)
        center_id = request.args.get("centerId", type=str)

        # Validate pagination parameters
        if page < 1:
            return (
                jsonify({"success": False, "message": "Page must be at least 1"}),
                400,
            )

        if limit < 1 or limit > 100:
            return (
                jsonify(
                    {"success": False, "message": "Limit must be between 1 and 100"}
                ),
                400,
            )

        logger.info(
            "Fetching users - search: %s, role: %s, status: %s, page: %s, limit: %s",
            search,
            role,
            status,
            page,
            limit,
        )

        # Get users from service
        result = get_users(
            search=search,
            role=role,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            center_id=center_id,
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching users: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching users",
                }
            ),
            500,
        )


@user_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id: int) -> Tuple:
    """
    Get a specific user by ID.

    Args:
        user_id: User ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Fetching user with ID: %s", user_id)

        result = get_user_by_id(user_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching user %s: %s", user_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching user",
                }
            ),
            500,
        )


@user_bp.route("/users", methods=["POST"])
@jwt_required()
def create_new_user() -> Tuple:
    """
    Create a new user.

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
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Creating new user: %s", data.get("email"))

        result = create_user(data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error creating user: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating user",
                }
            ),
            500,
        )


@user_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_existing_user(user_id: int) -> Tuple:
    """
    Update an existing user.

    Args:
        user_id: User ID

    Request Body:
        email (string, optional) - User email
        role (string, optional) - User role
        center_id (integer, optional) - Associated center ID
        is_active (boolean, optional) - User status

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Updating user with ID: %s", user_id)

        result = update_user(user_id, data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error updating user %s: %s", user_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while updating user",
                }
            ),
            500,
        )


@user_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_user(user_id: int) -> Tuple:
    """
    Delete a user.

    Args:
        user_id: User ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Deleting user with ID: %s", user_id)

        result = delete_user(user_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting user %s: %s", user_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting user",
                }
            ),
            500,
        )


@user_bp.route("/users/<int:user_id>/deactivate", methods=["PATCH"])
@jwt_required()
def deactivate_existing_user(user_id: int) -> Tuple:
    """
    Deactivate a user.

    Args:
        user_id: User ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Deactivating user with ID: %s", user_id)

        result = deactivate_user_service(user_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deactivating user %s: %s", user_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deactivating user",
                }
            ),
            500,
        )


@user_bp.route("/users/<int:user_id>/reactivate", methods=["PATCH"])
@jwt_required()
def reactivate_existing_user(user_id: int) -> Tuple:
    """
    Reactivate a user.

    Args:
        user_id: User ID

    Returns:
        Tuple containing JSON response and HTTP status code
    """
    try:
        logger.info("Reactivating user with ID: %s", user_id)

        result = reactivate_user_service(user_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error reactivating user %s: %s", user_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while reactivating user",
                }
            ),
            500,
        )
