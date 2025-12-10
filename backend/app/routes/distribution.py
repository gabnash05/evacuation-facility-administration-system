from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.distribution_service import DistributionService
from app.models.user import User
from app.schemas.distribution import CreateDistributionSchema, DistributionHistoryParams, UpdateDistributionSchema

bp = Blueprint("distribution_bp", __name__)

@bp.route("/distributions", methods=["POST"])
@jwt_required()
def create_distribution():
    current_user_id = get_jwt_identity()
    user = User.get_by_id(current_user_id)
    
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    schema = CreateDistributionSchema()
    try:
        data = schema.load(request.json)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    result, status = DistributionService.record_distribution(user, data)
    return jsonify(result), status

@bp.route("/distributions/history", methods=["GET"])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    user = User.get_by_id(current_user_id)

    schema = DistributionHistoryParams()
    try:
        params = schema.load(request.args)
        
        # Force center_id filter for Volunteers/Center Admins
        if user.role in ['volunteer', 'center_admin']:
            params['center_id'] = user.center_id
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    result, status = DistributionService.get_history(params)
    return jsonify(result), status

@bp.route("/distributions/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_distribution(id):
    current_user_id = get_jwt_identity()
    user = User.get_by_id(current_user_id)

    # Only Super Admin (or City Admin) can delete
    if user.role not in ['super_admin', 'city_admin']:
        return jsonify({"success": False, "message": "Forbidden"}), 403

    result, status = DistributionService.delete_distribution(id)
    return jsonify(result), status