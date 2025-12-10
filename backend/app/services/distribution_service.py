import logging
from app.models.distribution import Distribution

logger = logging.getLogger(__name__)

class DistributionService:
    @staticmethod
    def get_history(params):
        try:
            result = Distribution.get_history_paginated(
                center_id=params.get("center_id"),
                search=params.get("search"),
                page=params.get("page"),
                limit=params.get("limit")
            )
            
            # Format the response to match what the Frontend Store expects
            # The store expects: { success: True, data: [...] }
            # But usually paginated responses include metadata. 
            # For now, we return the list in 'data' to match your simple store logic.
            return {
                "success": True, 
                "data": result["data"],
                "pagination": {
                    "total": result["total"],
                    "page": result["page"],
                    "limit": result["limit"]
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Fetch history error: {str(e)}")
            return {"success": False, "message": "Failed to fetch history"}, 500