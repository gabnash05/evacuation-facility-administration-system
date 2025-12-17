"""Routes for dashboard statistics endpoints."""

import logging
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import stats_service
from app.schemas.stats import StatsFilterSchema, DashboardStatsResponseSchema
from app.models.user import User

logger = logging.getLogger(__name__)

# Create blueprint
stats_bp = Blueprint("stats_bp", __name__)

# Initialize schemas
filter_schema = StatsFilterSchema()
response_schema = DashboardStatsResponseSchema()


@stats_bp.route("/dashboard-stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics with optional filters.
    
    Query Parameters:
        - gender (optional): Male, Female, Other
        - age_group (optional): Child, Teen, Adult, Senior
        - center_id (optional): Filter by specific center (city admin only)
        - event_id (optional): Filter by specific event (NEW)
    
    Returns:
        JSON response with dashboard statistics
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Get query parameters
        gender = request.args.get("gender")
        age_group = request.args.get("age_group")
        center_id = request.args.get("center_id", type=int)
        event_id = request.args.get("event_id", type=int)  # NEW
        
        # Validate filters
        try:
            filters = filter_schema.load({
                "gender": gender,
                "age_group": age_group,
                "center_id": center_id,
                "event_id": event_id  # NEW
            })
        except Exception as validation_error:
            return jsonify({
                "success": False,
                "message": f"Validation error: {str(validation_error)}"
            }), 400
        
        # Role-based center filtering
        if user.role == "center_admin":
            # Center admin can only see their assigned center
            if not user.center_id:
                return jsonify({
                    "success": False,
                    "message": "No center assigned to this account"
                }), 403
            
            center_id = user.center_id
            
        elif user.role == "city_admin":
            # City admin can optionally filter by center_id
            # If not provided, shows city-wide stats
            pass
            
        elif user.role == "volunteer":
            # Volunteers see their assigned center
            if not user.center_id:
                return jsonify({
                    "success": False,
                    "message": "No center assigned to this account"
                }), 403
            
            center_id = user.center_id
            
        else:
            # Super admin sees city-wide stats
            pass
        
        # Get stats with event filter
        result = stats_service.get_dashboard_stats(
            center_id=center_id,
            gender=filters.get("gender"),
            age_group=filters.get("age_group"),
            event_id=filters.get("event_id")  # NEW
        )
        
        if not result.get("success"):
            return jsonify(result), 500
        
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error in get_dashboard_stats endpoint: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Failed to fetch dashboard statistics"
        }), 500


@stats_bp.route("/occupancy-stats", methods=["GET"])
@jwt_required()
def get_occupancy_stats():
    """
    Get occupancy utilization rate with optional filters.
    
    Query Parameters:
        - gender (optional): Male, Female, Other
        - age_group (optional): Child, Teen, Adult, Senior
        - center_id (optional): Filter by specific center (city admin only)
        - event_id (optional): Filter by specific event (NEW)
    
    Returns:
        JSON response with occupancy statistics
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Get query parameters
        gender = request.args.get("gender")
        age_group = request.args.get("age_group")
        center_id = request.args.get("center_id", type=int)
        event_id = request.args.get("event_id", type=int)  # NEW
        
        # Role-based center filtering
        if user.role in ["center_admin", "volunteer"]:
            if not user.center_id:
                return jsonify({
                    "success": False,
                    "message": "No center assigned to this account"
                }), 403
            center_id = user.center_id
        
        # Get stats with event filter
        occupancy_stats = stats_service.get_occupancy_stats(
            center_id=center_id,
            gender=gender,
            age_group=age_group,
            event_id=event_id  # NEW
        )
        
        return jsonify({
            "success": True,
            "data": occupancy_stats
        }), 200
        
    except Exception as error:
        logger.error("Error in get_occupancy_stats endpoint: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Failed to fetch occupancy statistics"
        }), 500


@stats_bp.route("/registration-stats", methods=["GET"])
@jwt_required()
def get_registration_stats():
    """
    Get registration penetration rate with optional filters.
    
    Query Parameters:
        - gender (optional): Male, Female, Other
        - age_group (optional): Child, Teen, Adult, Senior
        - center_id (optional): Filter by specific center (city admin only)
        - event_id (optional): Filter by specific event (NEW)
    
    Returns:
        JSON response with registration statistics
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Get query parameters
        gender = request.args.get("gender")
        age_group = request.args.get("age_group")
        center_id = request.args.get("center_id", type=int)
        event_id = request.args.get("event_id", type=int)  # NEW
        
        # Role-based center filtering
        if user.role in ["center_admin", "volunteer"]:
            if not user.center_id:
                return jsonify({
                    "success": False,
                    "message": "No center assigned to this account"
                }), 403
            center_id = user.center_id
        
        # Get stats with event filter
        registration_stats = stats_service.get_registration_stats(
            center_id=center_id,
            gender=gender,
            age_group=age_group,
            event_id=event_id  # NEW
        )
        
        return jsonify({
            "success": True,
            "data": registration_stats
        }), 200
        
    except Exception as error:
        logger.error("Error in get_registration_stats endpoint: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Failed to fetch registration statistics"
        }), 500


@stats_bp.route("/aid-distribution-stats", methods=["GET"])
@jwt_required()
def get_aid_distribution_stats():
    """
    Get aid distribution efficiency rate.
    
    Note: This stat does NOT support gender/age filters.
    
    Query Parameters:
        - center_id (optional): Filter by specific center (city admin only)
        - event_id (optional): Filter by specific event (NEW)
    
    Returns:
        JSON response with aid distribution statistics
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.get_by_id(current_user_id)
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Get query parameters
        center_id = request.args.get("center_id", type=int)
        event_id = request.args.get("event_id", type=int)  # NEW
        
        # Role-based center filtering
        if user.role in ["center_admin", "volunteer"]:
            if not user.center_id:
                return jsonify({
                    "success": False,
                    "message": "No center assigned to this account"
                }), 403
            center_id = user.center_id
        
        # Get stats with event filter
        aid_stats = stats_service.get_aid_distribution_stats(
            center_id=center_id,
            event_id=event_id  # NEW
        )
        
        return jsonify({
            "success": True,
            "data": aid_stats
        }), 200
        
    except Exception as error:
        logger.error("Error in get_aid_distribution_stats endpoint: %s", str(error))
        return jsonify({
            "success": False,
            "message": "Failed to fetch aid distribution statistics"
        }), 500