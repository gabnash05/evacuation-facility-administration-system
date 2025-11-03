# FILE NAME: app/routes/households.py

from flask import Blueprint, jsonify, request
from app.services.household_service import HouseholdService
from app.schemas.household import HouseholdQuerySchema, HouseholdListResponseSchema
from marshmallow import ValidationError

households_bp = Blueprint("households_bp", __name__)

# --- Existing route for listing households ---
@households_bp.route("/households", methods=["GET"])
def get_households():
    query_schema = HouseholdQuerySchema()
    try:
        params = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"success": False, "message": err.messages}), 400

    result = HouseholdService.get_all_households(params)

    if not result["success"]:
        return jsonify(result), 500

    list_response_schema = HouseholdListResponseSchema()
    return jsonify(list_response_schema.dump(result)), 200

# --- NEW: Route for deleting a household ---
@households_bp.route("/households/<int:household_id>", methods=["DELETE"])
def delete_household(household_id: int):
    result, status_code = HouseholdService.delete_household(household_id)
    return jsonify(result), status_code