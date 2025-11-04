from flask import Blueprint, jsonify, request
from app.services.household_service import HouseholdService
from app.schemas.household import (
    HouseholdQuerySchema, 
    HouseholdListResponseSchema,
    HouseholdCreateSchema,
    HouseholdUpdateSchema,
    HouseholdResponseSchema
)
from marshmallow import ValidationError

households_bp = Blueprint("households_bp", __name__)

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

@households_bp.route("/households", methods=["POST"])
def create_household():
    json_data = request.get_json()
    if not json_data:
        return jsonify({"success": False, "message": "No input data provided"}), 400
    schema = HouseholdCreateSchema()
    try:
        data = schema.load(json_data)
    except ValidationError as err:
        return jsonify({"success": False, "message": err.messages}), 400
    result, status_code = HouseholdService.create_household(data)
    return jsonify(result), status_code

@households_bp.route("/households/<int:household_id>", methods=["GET"])
def get_household(household_id: int):
    result, status_code = HouseholdService.get_household_by_id(household_id)
    return jsonify(result), status_code

@households_bp.route("/households/<int:household_id>", methods=["PUT"])
def update_household(household_id: int):
    json_data = request.get_json()
    if not json_data:
        return jsonify({"success": False, "message": "No input data provided"}), 400
    schema = HouseholdUpdateSchema()
    try:
        data = schema.load(json_data)
    except ValidationError as err:
        return jsonify({"success": False, "message": err.messages}), 400
    result, status_code = HouseholdService.update_household(household_id, data)
    return jsonify(result), status_code

@households_bp.route("/households/<int:household_id>", methods=["DELETE"])
def delete_household(household_id: int):

    result, status_code = HouseholdService.delete_household(household_id)
    return jsonify(result), status_code