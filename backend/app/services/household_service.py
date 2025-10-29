# app/services/household_service.py
import logging
import math
from app.models.household import Household

logger = logging.getLogger(__name__)

class HouseholdService:
    @staticmethod
    def get_all_households(params):
        """
        Orchestrates fetching paginated household data.
        """
        try:
            page = params.get('page', 1)
            per_page = params.get('per_page', 15)
            search = params.get('search', "")
            offset = (page - 1) * per_page

            households = Household.get_all_paginated(search=search, offset=offset, limit=per_page)
            total_records = Household.get_count(search=search)
            
            page_count = math.ceil(total_records / per_page) if total_records > 0 else 1

            pagination_meta = {
                "page": page,
                "per_page": per_page,
                "page_count": page_count,
                "total_records": total_records,
                "can_next_page": page < page_count,
                "can_previous_page": page > 1,
            }

            return {
                "success": True,
                "data": households,
                "pagination": pagination_meta,
            }
        except Exception as e:
            logger.error(f"Error fetching households: {e}")
            return {"success": False, "message": "An error occurred while fetching data."}