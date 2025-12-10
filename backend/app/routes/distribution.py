from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.distribution_service import DistributionService
from app.models.user import User
from app.schemas.distribution import CreateDistributionSchema, DistributionHistoryParams, UpdateDistributionSchema

bp = Blueprint("distribution_bp", __name__)

@bp.route("/distributions", methods=["POST"])
@jwt_required()
def create_distribution():
    user = User.get_by_id(get_jwt_identity())
    schema = CreateDistributionSchema()
    try:
        data = schema.load(request.json)
        result, status = DistributionService.record_distribution(user, data)
        return jsonify(result), status
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@bp.route("/distributions/history", methods=["GET"])
@jwt_required()
def get_history():
    user = User.get_by_id(get_jwt_identity())
    schema = DistributionHistoryParams()
    try:
        params = schema.load(request.args)
        if user.role in ['volunteer', 'center_admin']:
            params['center_id'] = user.center_id
            
        # Call the service and get both result and status
        service_result = DistributionService.get_history(params)
        
        # The service returns a tuple (result_dict, status_code)
        if isinstance(service_result, tuple) and len(service_result) == 2:
            result, status = service_result
            return jsonify(result), status
        else:
            # Handle case where service doesn't return tuple
            return jsonify(service_result), 200
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/distributions/<int:id>", methods=["PUT"])
@jwt_required()
def update_distribution(id):
    user = User.get_by_id(get_jwt_identity())
    if user.role != 'super_admin':
        return jsonify({"success": False, "message": "Forbidden"}), 403
        
    schema = UpdateDistributionSchema()
    try:
        data = schema.load(request.json)
        result, status = DistributionService.update_distribution(id, data)
        return jsonify(result), status
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@bp.route("/distributions/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_distribution(id):
    user = User.get_by_id(get_jwt_identity())
    if user.role != 'super_admin':
        return jsonify({"success": False, "message": "Forbidden"}), 403

    result, status = DistributionService.delete_distribution(id)
    return jsonify(result), status