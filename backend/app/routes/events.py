from flask import Blueprint, jsonify, request
from app.services.event_service import EventService
from app.schemas.event import (
    EventCreateSchema, 
    EventResponseSchema, 
    EventDetailsSchema,
    AddCenterSchema
)

bp = Blueprint("event_bp", __name__, url_prefix="/api/events")

create_schema = EventCreateSchema()
response_schema = EventResponseSchema()
details_schema = EventDetailsSchema()
add_center_schema = AddCenterSchema()

@bp.route("/", methods=["GET"])
def get_all_events():
    """GET /api/events - List all disaster events"""
    result = EventService.get_all_events()
    return jsonify(result["data"]), 200

@bp.route("/", methods=["POST"])
def create_event():
    """POST /api/events - Create a new disaster event"""
    try:
        data = create_schema.load(request.get_json())
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    result = EventService.create_event(data)
    if result["success"]:
        return jsonify({"event_id": result["data"]["event_id"]}), 201
    return jsonify(result), 400

@bp.route("/<int:event_id>", methods=["GET"])
def get_event_details(event_id):
    """GET /api/events/<id> - Retrieve event details"""
    result = EventService.get_event_details(event_id)
    if not result["success"]:
        return jsonify({"success": False, "message": result["message"]}), 404
    
    # Format response according to API contract
    event = result["data"]["event"]
    centers = result["data"]["centers"]
    
    response = {
        "event_id": event["event_id"],
        "event_type": event["event_type"],
        "status": event["status"],
        "centers": centers
    }
    return jsonify(response), 200

@bp.route("/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    """PUT /api/events/<id> - Update event info"""
    data = request.get_json()
    
    # Check if it's just a status update
    if "status" in data and len(data) == 1:
        result = EventService.update_event_status(event_id, data["status"])
    else:
        try:
            validated_data = create_schema.load(data)
            result = EventService.update_event(event_id, validated_data)
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 400
    
    if result["success"]:
        return jsonify({"success": True}), 200
    return jsonify(result), 404

@bp.route("/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    """DELETE /api/events/<id> - Delete an event"""
    result = EventService.delete_event(event_id)
    if result["success"]:
        return jsonify({"success": True}), 200
    return jsonify(result), 404

@bp.route("/<int:event_id>/centers", methods=["GET"])
def get_event_centers(event_id):
    """GET /api/events/<id>/centers - List all centers linked to an event"""
    result = EventService.get_event_centers(event_id)
    if result["success"]:
        return jsonify(result["data"]), 200
    return jsonify(result), 404

@bp.route("/<int:event_id>/centers", methods=["POST"])
def add_event_center(event_id):
    """POST /api/events/<id>/centers - Link a center to an event"""
    try:
        data = add_center_schema.load(request.get_json())
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400
    
    result = EventService.add_center_to_event(event_id, data["center_id"])
    if result["success"]:
        return jsonify({"success": True}), 200
    return jsonify(result), 400

@bp.route("/<int:event_id>/centers/<int:center_id>", methods=["DELETE"])
def remove_event_center(event_id, center_id):
    """DELETE /api/events/<event_id>/centers/<center_id> - Unlink a center from an event"""
    result = EventService.remove_center_from_event(event_id, center_id)
    if result["success"]:
        return jsonify({"success": True}), 200
    return jsonify(result), 404