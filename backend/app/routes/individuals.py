# FILE NAME: app/routes/individuals.py

from flask import Blueprint, jsonify
from app.models.individual import Individual
from app.schemas.individual import IndividualSelectionSchema
import logging

logger = logging.getLogger(__name__)

# Create the Blueprint object that will be imported by __init__.py
individuals_bp = Blueprint("individuals_bp", __name__)

@individuals_bp.route("/households/<int:household_id>/individuals", methods=["GET"])
def get_individuals_for_household(household_id: int):
    """
    API endpoint to get a simple list of individuals for a specific household.
    """
    try:
        # 1. Call the model directly to get the data
        individuals = Individual.get_by_household_id(household_id)

        # 2. Instantiate the schema to format the output
        selection_schema = IndividualSelectionSchema(many=True)

        # 3. Return the successful, formatted response
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