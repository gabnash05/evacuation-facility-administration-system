from flask import Blueprint, jsonify, request
from app.services.household_service import HouseholdService
from app.schemas.household import HouseholdQuerySchema, HouseholdListResponseSchema
from marshmallow import ValidationError

households_bp = Blueprint("households_bp", __name__)
query_schema = HouseholdQuerySchema()
response_schema = HouseholdListResponseSchema()


@households_bp.route("/households", methods=["GET"])
def get_households():
    """
    API endpoint to get a paginated list of households.
    Accepts 'page', 'per_page', and 'search' query parameters.
    """
    try:
        # Validate query parameters
        params = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"success": False, "message": err.messages}), 400

    result = HouseholdService.get_all_households(params)

    if not result["success"]:
        return jsonify(result), 500

    # Serialize the successful response
    return jsonify(response_schema.dump(result)), 200
