from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import logging

from app.services.individual_service import (
    get_individuals,
    get_individual_by_id,
    create_individual,
    update_individual,
    delete_individuals,
    get_individuals_by_household,
)

logger = logging.getLogger(__name__)

individuals_bp = Blueprint("individuals_bp", __name__)


@individuals_bp.route("/individuals", methods=["GET"])
@jwt_required()
def list_individuals() -> Tuple:
    search = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    result = get_individuals(search=search, page=page, limit=limit)
    if not result["success"]:
        return jsonify(result), 500
    return jsonify(result), 200


@individuals_bp.route("/individuals", methods=["POST"])
@jwt_required()
def create_new_individual() -> Tuple:
    data = request.get_json() or {}
    result = create_individual(data)
    if not result["success"]:
        return jsonify(result), 400
    return jsonify({"success": True, "data": result["data"]}), 201


@individuals_bp.route("/individuals/<int:individual_id>", methods=["GET"])
@jwt_required()
def get_individual(individual_id: int) -> Tuple:
    result = get_individual_by_id(individual_id)
    if not result["success"]:
        return jsonify(result), 404
    return jsonify(result), 200


@individuals_bp.route("/individuals/<int:individual_id>", methods=["PUT"])
@jwt_required()
def update_existing_individual(individual_id: int) -> Tuple:
    data = request.get_json() or {}
    result = update_individual(individual_id, data)
    if not result["success"]:
        return jsonify(result), 400
    return jsonify(result), 200


@individuals_bp.route("/individuals", methods=["DELETE"])
@jwt_required()
def delete_multiple_individuals() -> Tuple:
    data = request.get_json() or {}
    ids = data.get("ids", [])
    if not ids:
        return jsonify({"success": False, "message": "No ids provided"}), 400
    result = delete_individuals(ids)
    if not result["success"]:
        return jsonify(result), 500
    return jsonify(result), 200


@individuals_bp.route("/households/<int:household_id>/individuals", methods=["GET"])
@jwt_required()
def list_household_individuals(household_id: int) -> Tuple:
    result = get_individuals_by_household(household_id)
    if not result["success"]:
        return jsonify(result), 500
    return jsonify(result), 200
