from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.distribution_service import DistributionService
from app.models.user import User
from app.schemas.distribution import DistributionHistoryParams

bp = Blueprint("distribution_bp", __name__)

@bp.route("/distributions/history", methods=["GET"])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    user = User.get_by_id(current_user_id)

    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    schema = DistributionHistoryParams()
    try:
        params = schema.load(request.args)
        
        # Security: Force center_id filter for Volunteers/Center Admins
        # They should NOT see distributions from other centers.
        if user.role in ['volunteer', 'center_admin'] and user.center_id:
            params['center_id'] = user.center_id
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    result, status = DistributionService.get_history(params)
    return jsonify(result), status