"""Flask routes for individual operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.individual_service import IndividualService

# Configure logger for this module
logger = logging.getLogger(__name__)

individuals_bp = Blueprint("individuals_bp", __name__)


@individuals_bp.route("/individuals", methods=["GET"])
@jwt_required()
def get_all_individuals() -> Tuple:
    """
    Get all individuals with filtering, pagination, and sorting.

    Query Parameters:
        search (string) - Search in individual names
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sortBy (string) - Field to sort by
        sortOrder (string) - Sort direction (asc/desc)
        household_id (integer) - Filter by household ID (optional)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters with consistent naming
        search = request.args.get("search", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sortBy", type=str)
        sort_order = request.args.get("sortOrder", type=str)
        household_id = request.args.get("household_id", type=int)

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
            "Fetching individuals - search: %s, page: %s, limit: %s, household_id: %s",
            search,
            page,
            limit,
            household_id,
        )

        # Prepare params for service
        params = {
            "search": search,
            "page": page,
            "limit": limit,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "household_id": household_id,
        }

        # Get individuals from service
        result = IndividualService.get_all_individuals(params)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching individuals: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching individuals",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals", methods=["POST"])
@jwt_required()
def create_individual() -> Tuple:
    """
    Create a new individual.

    Request Body (JSON):
        first_name (string) - Individual first name
        last_name (string) - Individual last name
        date_of_birth (string, optional) - Date of birth (YYYY-MM-DD)
        gender (string, optional) - Gender (Male/Female/Other)
        relationship_to_head (string) - Relationship to household head
        household_id (integer) - Household ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info("Creating new individual")

        result = IndividualService.create_individual(json_data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error creating individual: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating individual",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals/<int:individual_id>", methods=["GET"])
@jwt_required()
def get_individual(individual_id: int) -> Tuple:
    """
    Get a specific individual by ID.

    Args:
        individual_id: Individual ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Fetching individual with ID: %s", individual_id)

        result = IndividualService.get_individual_by_id(individual_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching individual %s: %s", individual_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching individual",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals/<int:individual_id>", methods=["PUT"])
@jwt_required()
def update_individual(individual_id: int) -> Tuple:
    """
    Update an existing individual.

    Args:
        individual_id: Individual ID

    Request Body (JSON):
        first_name (string, optional) - Individual first name
        last_name (string, optional) - Individual last name
        date_of_birth (string, optional) - Date of birth (YYYY-MM-DD)
        gender (string, optional) - Gender (Male/Female/Other)
        relationship_to_head (string, optional) - Relationship to household head

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info("Updating individual with ID: %s", individual_id)

        result = IndividualService.update_individual(individual_id, json_data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error updating individual %s: %s", individual_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while updating individual",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals", methods=["DELETE"])
@jwt_required()
def delete_individuals() -> Tuple:
    """
    Delete multiple individuals.

    Request Body (JSON):
        ids (array) - List of individual IDs to delete

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        json_data = request.get_json() or {}
        ids = json_data.get("ids", [])
        
        if not ids:
            return jsonify({"success": False, "message": "No ids provided"}), 400

        logger.info("Deleting individuals: %s", ids)

        result = IndividualService.delete_individuals(ids)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting individuals: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting individuals",
                }
            ),
            500,
        )


@individuals_bp.route("/households/<int:household_id>/individuals", methods=["GET"])
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

        result = IndividualService.get_individuals_by_household(household_id)

        if not result["success"]:
            return jsonify(result), 404

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