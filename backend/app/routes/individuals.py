from flask import Blueprint, jsonify
from app.models.individual import Individual
from app.schemas.individual import IndividualSelectionSchema
import logging

logger = logging.getLogger(__name__)

individuals_bp = Blueprint("individuals_bp", __name__)

@individuals_bp.route("/households/<int:household_id>/individuals", methods=["GET"])
def get_individuals_for_household(household_id: int):
    """
    API endpoint to get a simple list of individuals for a specific household.
    """
    try:
        individuals = Individual.get_by_household_id(household_id)
        selection_schema = IndividualSelectionSchema(many=True)

        return jsonify({
            "success": True, 
            "data": selection_schema.dump(individuals)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching individuals for household {household_id}: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching individuals."
        }), 500