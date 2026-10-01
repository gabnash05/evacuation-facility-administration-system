from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.distribution_service import DistributionService
from app.models.user import User
from app.schemas.distribution import CreateDistributionSchema, DistributionHistoryParams, UpdateDistributionSchema

bp = Blueprint("distribution_bp", __name__)


def _current_actor():
    user = User.get_by_id(get_jwt_identity())
    return user if user and user.is_active else None

@bp.route("/distributions", methods=["POST"])
@jwt_required()
def create_distribution():
    user = _current_actor()
    if not user:
        return jsonify({"success": False, "message": "Invalid token"}), 401
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
    user = _current_actor()
    if not user:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    schema = DistributionHistoryParams()
    try:
        params = schema.load(request.args)
        if user.role in ['volunteer', 'center_admin']:
            params['center_id'] = user.center_id
        
        service_result = DistributionService.get_history(params)
        
        if isinstance(service_result, tuple) and len(service_result) == 2:
            result, status = service_result
            return jsonify(result), status
        return jsonify(service_result), 200
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@bp.route("/distributions/<int:id>", methods=["PUT"])
@jwt_required()
def update_distribution(id):
    user = _current_actor()
    if not user:
        return jsonify({"success": False, "message": "Invalid token"}), 401
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
    user = _current_actor()
    if not user:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    if user.role != 'super_admin':
        return jsonify({"success": False, "message": "Forbidden"}), 403

    result, status = DistributionService.delete_distribution(id)
    return jsonify(result), status

# NEW ROUTE
@bp.route("/distributions/<int:id>/status", methods=["PATCH"])
@jwt_required()
def toggle_status(id):
    user = _current_actor()
    if not user:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    if user.role != "super_admin":
        return jsonify({"success": False, "message": "Forbidden"}), 403
    result, status = DistributionService.toggle_status(id)
    return jsonify(result), status
