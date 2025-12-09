"""Flask routes for individual operations with real-time status support."""

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
    Now includes real-time status, gender, age group, and center filtering.

    Query Parameters:
        search (string) - Search in individual names
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sortBy (string) - Field to sort by
        sortOrder (string) - Sort direction (asc/desc)
        household_id (integer) - Filter by household ID (optional)
        status (string) - Filter by current_status (checked_in, checked_out, transferred, all)
        gender (string) - Filter by gender (Male, Female, Other, all)
        age_group (string) - Filter by age group (child, young_adult, middle_aged, senior, all)
        center_id (integer) - Filter by current center ID (for checked-in individuals)

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
        
        # New real-time status filtering parameters
        status = request.args.get("status", type=str)
        gender = request.args.get("gender", type=str)
        age_group = request.args.get("age_group", type=str)
        center_id = request.args.get("center_id", type=int)

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
            "Fetching individuals with filters - status: %s, gender: %s, age_group: %s, center_id: %s, household_id: %s",
            status, gender, age_group, center_id, household_id
        )

        # Prepare params for service
        params = {
            "search": search,
            "page": page,
            "limit": limit,
            "sort_by": sort_by,
            "sort_order": sort_order,
            "household_id": household_id,
            "status": status,
            "gender": gender,
            "age_group": age_group,
            "center_id": center_id,
        }

        # Get individuals from service
        result = IndividualService.get_all_individuals(params)

        print(result)

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


@individuals_bp.route("/individuals/status-summary", methods=["GET"])
@jwt_required()
def get_individuals_status_summary() -> Tuple:
    """
    Get summary statistics of individuals grouped by current status.
    Useful for dashboard widgets.
    
    Query Parameters:
        center_id (integer) - Filter by center ID (optional)
        event_id (integer) - Filter by event ID (optional)
        
    Returns:
        Tuple containing:
            - JSON response with status summary
            - HTTP status code
    """
    try:
        center_id = request.args.get("center_id", type=int)
        event_id = request.args.get("event_id", type=int)
        
        logger.info("Getting status summary - center_id: %s, event_id: %s", center_id, event_id)
        
        # Prepare params for service
        params = {
            "center_id": center_id,
            "event_id": event_id,
        }
        
        result = IndividualService.get_status_summary(params)
        
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error fetching status summary: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching status summary",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals/search", methods=["GET"])
@jwt_required()
def search_individuals() -> Tuple:
    """
    Search individuals by name with real-time status.
    
    Query Parameters:
        name (string) - Search term (required)
        limit (integer) - Maximum results (default: 10, max: 50)
        
    Returns:
        Tuple containing:
            - JSON response with search results
            - HTTP status code
    """
    try:
        name = request.args.get("name", type=str)
        limit = request.args.get("limit", 10, type=int)
        
        if not name:
            return (
                jsonify({"success": False, "message": "Search term is required"}),
                400,
            )
            
        if limit < 1 or limit > 50:
            return (
                jsonify({"success": False, "message": "Limit must be between 1 and 50"}),
                400,
            )
            
        logger.info("Searching individuals by name: %s", name)
        
        result = IndividualService.search_individuals_by_name(name, limit)
        
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error searching individuals: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while searching individuals",
                }
            ),
            500,
        )


@individuals_bp.route("/individuals/recalculate-statuses", methods=["POST"])
@jwt_required()
def recalculate_individual_statuses() -> Tuple:
    """
    Recalculate current_status for all individuals.
    Useful for data integrity checks or after data migrations.
    
    Returns:
        Tuple containing:
            - JSON response with recalculation results
            - HTTP status code
    """
    try:
        logger.info("Recalculating all individual statuses")
        
        result = IndividualService.recalculate_all_statuses()
        
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error recalculating statuses: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while recalculating statuses",
                }
            ),
            500,
        )


# The existing routes (create_individual, get_individual, update_individual, 
# delete_individuals, get_household_individuals) remain the same as before
# but will now include real-time status in their responses automatically

@individuals_bp.route("/individuals", methods=["POST"])
@jwt_required()
def create_individual() -> Tuple:
    """
    Create a new individual with real-time status tracking.
    
    Request Body (JSON):
        first_name (string) - Individual first name
        last_name (string) - Individual last name
        date_of_birth (string, optional) - Date of birth (YYYY-MM-DD)
        gender (string, optional) - Gender (Male/Female/Other)
        relationship_to_head (string) - Relationship to household head
        household_id (integer) - Household ID
        
    Returns:
        Tuple containing:
            - JSON response with standardized format including real-time status
            - HTTP status code
    """
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"success": False, "message": "No input data provided"}), 400

        logger.info("Creating new individual with real-time status tracking")

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
    Get a specific individual by ID with real-time status information.
    
    Args:
        individual_id: Individual ID
        
    Returns:
        Tuple containing:
            - JSON response with real-time status and current center info
            - HTTP status code
    """
    try:
        logger.info("Fetching individual with ID: %s (with real-time status)", individual_id)

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
            - JSON response with updated real-time status
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
    Get all individuals for a specific household with real-time status.
    
    Args:
        household_id: Household ID
        
    Returns:
        Tuple containing:
            - JSON response with real-time status for each individual
            - HTTP status code
    """
    try:
        logger.info("Fetching individuals for household ID: %s (with real-time status)", household_id)

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