"""Flask routes for aid allocation operations (allocation-only)."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.aid_allocation_service import (
    get_allocations,
    get_allocation_by_id,
    create_allocation,
    update_allocation,
    delete_allocation,
    get_center_allocations,
    get_aid_categories,
)
from app.services.user_service import get_current_user

# Configure logger for this module
logger = logging.getLogger(__name__)

aid_allocation_bp = Blueprint("aid_allocation_bp", __name__)


@aid_allocation_bp.route("/allocations", methods=["GET"])
@jwt_required()
def get_allocations_route() -> Tuple:
    """
    Get all aid allocations with filtering and pagination.

    City Admin: Can see all allocations across all centers
    Center Admin: Can only see allocations for their assigned center (backend filtered)
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        # Extract query parameters
        center_id = request.args.get("center_id", type=int)
        category_id = request.args.get("category_id", type=int)
        status = request.args.get("status", type=str)
        search = request.args.get("search", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", "desc", type=str)

        # Validate pagination
        if page < 1:
            return jsonify({"success": False, "message": "Page must be at least 1"}), 400
        if limit < 1 or limit > 100:
            return jsonify({"success": False, "message": "Limit must be between 1 and 100"}), 400

        # Center Admin & Volunteer: Can only view allocations for their assigned center
        if current_user.role in ["center_admin", "volunteer"] and current_user.center_id:
            # Override any center_id filter - they can only see their center
            center_id = current_user.center_id
        elif current_user.role == "volunteer":
            return jsonify({"success": False, "message": "Volunteers cannot view allocations"}), 403

        logger.info(
            "Fetching allocations - user: %s (%s), center_id: %s",
            current_user.email,
            current_user.role,
            center_id,
        )

        # Get allocations from service
        result = get_allocations(
            center_id=center_id,
            category_id=category_id,
            status=status,
            search=search,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            user_role=current_user.role,
            user_center_id=current_user.center_id,
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching allocations: %s", str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while fetching allocations"}),
            500,
        )


@aid_allocation_bp.route("/allocations/center/<int:center_id>", methods=["GET"])
@jwt_required()
def get_center_allocations_route(center_id: int) -> Tuple:
    """
    Get allocations for a specific center.
    Center Admin: Can only access their own center's allocations.
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        # Center Admin: Verify they're accessing their own center
        if current_user.role == "center_admin" and current_user.center_id != center_id:
            return (
                jsonify({"success": False, "message": "You can only view allocations for your assigned center"}),
                403,
            )

        # Extract query parameters
        category_id = request.args.get("category_id", type=int)
        status = request.args.get("status", type=str)
        search = request.args.get("search", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", "desc", type=str)

        # Validate pagination
        if page < 1:
            return jsonify({"success": False, "message": "Page must be at least 1"}), 400
        if limit < 1 or limit > 100:
            return jsonify({"success": False, "message": "Limit must be between 1 and 100"}), 400

        logger.info("Fetching allocations for center: %s", center_id)

        # Get center allocations from service
        result = get_center_allocations(
            center_id=center_id,
            category_id=category_id,
            status=status,
            search=search,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching center allocations for center %s: %s", center_id, str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while fetching center allocations"}),
            500,
        )


@aid_allocation_bp.route("/allocations", methods=["POST"])
@jwt_required()
def create_allocation_route() -> Tuple:
    """
    Create a new aid allocation (City Admin only).
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        # Only City Admin and Super Admin can create allocations
        if current_user.role not in ["city_admin", "super_admin"]:
            return (
                jsonify({"success": False, "message": "Only City Administrators can create allocations"}),
                403,
            )

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Add allocated_by_user_id
        data["allocated_by_user_id"] = current_user.user_id

        # Validate required fields
        required_fields = [
            "center_id",
            "event_id",
            "category_id",
            "resource_name",
            "total_quantity",
            "distribution_type",
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        logger.info(
            "Creating allocation - resource: %s, center: %s, quantity: %s",
            data.get("resource_name"),
            data.get("center_id"),
            data.get("total_quantity"),
        )

        # Create allocation
        result = create_allocation(data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error creating allocation: %s", str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while creating allocation"}),
            500,
        )


@aid_allocation_bp.route("/allocations/<int:allocation_id>", methods=["PUT"])
@jwt_required()
def update_allocation_route(allocation_id: int) -> Tuple:
    """
    Update an existing allocation (City Admin only).
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        # Only City Admin and Super Admin can update allocations
        if current_user.role not in ["city_admin", "super_admin"]:
            return (
                jsonify({"success": False, "message": "Only City Administrators can update allocations"}),
                403,
            )

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Updating allocation: %s", allocation_id)

        # Update allocation
        result = update_allocation(allocation_id, data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error updating allocation %s: %s", allocation_id, str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while updating allocation"}),
            500,
        )


@aid_allocation_bp.route("/allocations/<int:allocation_id>", methods=["DELETE"])
@jwt_required()
def delete_allocation_route(allocation_id: int) -> Tuple:
    """
    Delete an allocation (City Admin only).
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        # Only City Admin and Super Admin can delete allocations
        if current_user.role not in ["city_admin", "super_admin"]:
            return (
                jsonify({"success": False, "message": "Only City Administrators can delete allocations"}),
                403,
            )

        logger.info("Deleting allocation: %s", allocation_id)

        # Delete allocation
        result = delete_allocation(allocation_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting allocation %s: %s", allocation_id, str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while deleting allocation"}),
            500,
        )


@aid_allocation_bp.route("/aid-categories", methods=["GET"])
@jwt_required()
def get_aid_categories_route() -> Tuple:
    """
    Get all aid categories.
    Available to all authenticated users.
    """
    try:
        logger.info("Fetching aid categories")

        result = get_aid_categories()

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching aid categories: %s", str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while fetching aid categories"}),
            500,
        )


@aid_allocation_bp.route("/allocations/<int:allocation_id>", methods=["GET"])
@jwt_required()
def get_allocation_by_id_route(allocation_id: int) -> Tuple:
    """
    Get a specific allocation by ID.
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)

        if not current_user:
            return (
                jsonify({"success": False, "message": "Unauthorized: Unable to determine current user"}),
                401,
            )

        logger.info("Fetching allocation: %s", allocation_id)

        # Get allocation
        result = get_allocation_by_id(allocation_id)

        if not result["success"]:
            return jsonify(result), 404

        # Center Admin: Verify they're accessing their own center's allocation
        if current_user.role == "center_admin" and current_user.center_id:
            allocation_data = result.get("data", {})
            if allocation_data.get("center_id") != current_user.center_id:
                return (
                    jsonify({"success": False, "message": "You can only view allocations for your assigned center"}),
                    403,
                )

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching allocation %s: %s", allocation_id, str(error))
        return (
            jsonify({"success": False, "message": "Internal server error while fetching allocation"}),
            500,
        )