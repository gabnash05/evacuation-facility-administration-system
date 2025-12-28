"""Flask routes for household operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.household_service import HouseholdService

# Configure logger for this module
logger = logging.getLogger(__name__)

households_bp = Blueprint("households_bp", __name__)


@households_bp.route("/households", methods=["GET"])
@jwt_required()
def get_all_households() -> Tuple:
    """
    Get all households with filtering, pagination, and sorting.

    Query Parameters:
        search (string) - Search in household name or address
        page (integer) - Page number (default: 1)
        per_page (integer) - Items per page (default: 10)
        sort_by (string) - Field to sort by
        sort_order (string) - Sort direction (asc/desc)
        center_id (integer) - Filter by center ID (optional)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters with consistent naming
        search = request.args.get("search", type=str)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", type=str)
        center_id = request.args.get("center_id", type=int)  # Add center_id parameter

        # Validate pagination parameters
        if page < 1:
            return (
                jsonify({"success": False, "message": "Page must be at least 1"}),
                400,
            )

        if per_page < 1 or per_page > 100:
            return (
                jsonify(
                    {"success": False, "message": "per_page must be between 1 and 100"}
                ),
                400,
            )

        # Prepare params for service - use consistent naming
        params = {
            "search": search,
            "page": page,
            "per_page": per_page,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "center_id": center_id,  # Add center_id to params
        }

        # Get households from service
        result = HouseholdService.get_all_households(params)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching households: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching households",
                }
            ),
            500,
        )


@households_bp.route("/households/<int:household_id>", methods=["GET"])
@jwt_required()
def get_household(household_id: int) -> Tuple:
    """
    Get a specific household by ID.

    Args:
        household_id: Household ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Fetching household with ID: %s", household_id)

        result, status_code = HouseholdService.get_household_by_id(household_id)

        if not result["success"]:
            return jsonify(result), status_code

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching household %s: %s", household_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching household",
                }
            ),
            500,
        )


@households_bp.route("/households-with-individuals", methods=["POST"])
@jwt_required()
def create_household_with_individuals() -> Tuple:
    """
    Create a new household with individuals in one atomic operation.

    Request Body (JSON):
        household_name (string) - Household name
        address (string) - Household address
        center_id (integer) - Evacuation center ID
        individuals (array) - List of individuals to create with household
            - first_name (string) - Individual first name
            - last_name (string) - Individual last name
            - date_of_birth (string, optional) - Date of birth (YYYY-MM-DD)
            - gender (string, optional) - Gender (Male/Female/Other)
            - relationship_to_head (string) - Relationship to household head

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info(
            "Creating new household with individuals: %s",
            json_data.get("household_name"),
        )

        result, status_code = HouseholdService.create_household_with_individuals(
            json_data
        )

        return jsonify(result), status_code

    except Exception as error:
        logger.error("Error creating household with individuals: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating household",
                }
            ),
            500,
        )


@households_bp.route("/households/<int:household_id>", methods=["PUT"])
@jwt_required()
def update_household(household_id: int) -> Tuple:
    """
    Update an existing household.

    Args:
        household_id: Household ID

    Request Body (JSON):
        household_name (string, optional) - Household name
        address (string, optional) - Household address
        center_id (integer, optional) - Evacuation center ID
        household_head_id (integer, optional) - Household head individual ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info("Updating household with ID: %s", household_id)

        result, status_code = HouseholdService.update_household(household_id, json_data)

        return jsonify(result), status_code

    except Exception as error:
        logger.error("Error updating household %s: %s", household_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while updating household",
                }
            ),
            500,
        )


@households_bp.route("/households/<int:household_id>", methods=["DELETE"])
@jwt_required()
def delete_household(household_id: int) -> Tuple:
    """
    Delete a household.

    Args:
        household_id: Household ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Deleting household with ID: %s", household_id)

        result, status_code = HouseholdService.delete_household(household_id)

        return jsonify(result), status_code

    except Exception as error:
        logger.error("Error deleting household %s: %s", household_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting household",
                }
            ),
            500,
        )


@households_bp.route("/households/<int:household_id>/individuals", methods=["GET"])
@jwt_required()
def get_household_individuals(household_id: int) -> Tuple:
    """
    Get all individuals for a specific household.

    Args:
        household_id: Household ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Fetching individuals for household ID: %s", household_id)

        result, status_code = HouseholdService.get_household_individuals(household_id)

        if not result["success"]:
            return jsonify(result), status_code

        return jsonify(result), 200

    except Exception as error:
        logger.error(
            "Error fetching individuals for household %s: %s", household_id, str(error)
        )
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching household individuals",
                }
            ),
            500,
        )


@households_bp.route("/households/<int:household_id>/individuals", methods=["POST"])
@jwt_required()
def create_household_individual(household_id: int) -> Tuple:
    """
    Create a new individual for a household.

    Args:
        household_id: Household ID

    Request Body (JSON):
        first_name (string) - Individual first name
        last_name (string) - Individual last name
        date_of_birth (string, optional) - Date of birth (YYYY-MM-DD)
        gender (string, optional) - Gender (Male/Female/Other)
        relationship_to_head (string) - Relationship to household head

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info("Creating individual for household ID: %s", household_id)

        result, status_code = HouseholdService.create_individual_for_household(
            household_id, json_data
        )

        return jsonify(result), status_code

    except Exception as error:
        logger.error(
            "Error creating individual for household %s: %s", household_id, str(error)
        )
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating household individual",
                }
            ),
            500,
        )


@households_bp.route("/households/count/center/<int:center_id>", methods=["GET"])
@jwt_required()
def get_center_household_count(center_id: int) -> Tuple:
    """
    Get number of households in a center.
    
    Args:
        center_id: Center ID
        
    Returns:
        Tuple containing:
            - JSON response with household count
            - HTTP status code
    """
    try:
        logger.info("Fetching household count for center: %s", center_id)

        result = HouseholdService.get_center_household_count(center_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching household count for center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching household count",
                }
            ),
            500,
        )