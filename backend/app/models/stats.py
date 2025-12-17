from typing import Any, Dict, Optional
from datetime import datetime, date
from sqlalchemy import text
from app.models import db
import logging

logger = logging.getLogger(__name__)


class Stats:

    @staticmethod
    def calculate_age(date_of_birth: date) -> int:
        today = datetime.now().date()
        age = today.year - date_of_birth.year
        if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
            age -= 1
        return age

    @staticmethod
    def get_age_group(date_of_birth: Optional[date]) -> Optional[str]:
        if not date_of_birth:
            return None
        
        age = Stats.calculate_age(date_of_birth)
        
        if age <= 12:
            return "Child"
        elif age <= 17:
            return "Teen"
        elif age <= 59:
            return "Adult"
        else:
            return "Senior"

    @staticmethod
    def _get_age_date_range(age_group: str) -> tuple:
        if age_group == "Child":
            min_age, max_age = 0, 12
        elif age_group == "Teen":
            min_age, max_age = 13, 17
        elif age_group == "Adult":
            min_age, max_age = 18, 59
        else:
            min_age, max_age = 60, 200
        
        today = datetime.now().date()
        max_birth_date = date(today.year - min_age, today.month, today.day)
        min_birth_date = date(today.year - max_age - 1, today.month, today.day)
        
        return min_birth_date, max_birth_date

    @classmethod
    def get_occupancy_stats(
        cls,
        center_id: Optional[int] = None,
        gender: Optional[str] = None,
        age_group: Optional[str] = None,
        event_id: Optional[int] = None,  # NEW
    ) -> Dict[str, Any]:
        try:
            # Capacity calculation (unchanged - capacity is center-based, not event-based)
            if center_id:
                capacity_query = text("""
                    SELECT COALESCE(capacity, 0) as total_capacity
                    FROM evacuation_centers
                    WHERE center_id = :center_id AND status = 'active'
                """)
                capacity_result = db.session.execute(
                    capacity_query, 
                    {"center_id": center_id}
                ).fetchone()
                total_capacity = capacity_result[0] if capacity_result else 0
            else:
                capacity_query = text("""
                    SELECT COALESCE(SUM(capacity), 0) as total_capacity
                    FROM evacuation_centers
                    WHERE status = 'active'
                """)
                capacity_result = db.session.execute(capacity_query).fetchone()
                total_capacity = capacity_result[0] if capacity_result else 0

            # Occupancy calculation with event filter
            occupancy_query = """
                SELECT COUNT(DISTINCT ar.individual_id) as current_occupancy
                FROM attendance_records ar
                JOIN individuals i ON ar.individual_id = i.individual_id
                WHERE ar.status = 'checked_in' 
                AND ar.check_out_time IS NULL
            """
            params = {}
            
            if center_id:
                occupancy_query += " AND ar.center_id = :center_id"
                params["center_id"] = center_id
            
            # NEW: Add event filter
            if event_id:
                occupancy_query += " AND ar.event_id = :event_id"
                params["event_id"] = event_id
            
            if gender:
                occupancy_query += " AND i.gender = :gender"
                params["gender"] = gender
            
            if age_group:
                min_birth_date, max_birth_date = cls._get_age_date_range(age_group)
                occupancy_query += """
                    AND i.date_of_birth IS NOT NULL
                    AND i.date_of_birth >= :min_birth_date 
                    AND i.date_of_birth <= :max_birth_date
                """
                params["min_birth_date"] = min_birth_date
                params["max_birth_date"] = max_birth_date
            
            occupancy_result = db.session.execute(
                text(occupancy_query), 
                params
            ).fetchone()
            
            current_occupancy = occupancy_result[0] if occupancy_result else 0
            
            percentage = 0
            if total_capacity > 0:
                percentage = round((current_occupancy / total_capacity) * 100, 2)
            
            return {
                "current_occupancy": current_occupancy,
                "total_capacity": total_capacity,
                "percentage": percentage
            }
            
        except Exception as error:
            logger.error("Error calculating occupancy stats: %s", str(error))
            return {
                "current_occupancy": 0,
                "total_capacity": 0,
                "percentage": 0
            }

    @classmethod
    def get_registration_stats(
        cls,
        center_id: Optional[int] = None,
        gender: Optional[str] = None,
        age_group: Optional[str] = None,
        event_id: Optional[int] = None,  # NEW
    ) -> Dict[str, Any]:
        try:
            # Total registered (unchanged - not event-specific)
            registered_query = """
                SELECT COUNT(DISTINCT i.individual_id) as total_registered
                FROM individuals i
                JOIN households h ON i.household_id = h.household_id
                WHERE 1=1
            """
            params = {}
            
            if center_id:
                registered_query += " AND h.center_id = :center_id"
                params["center_id"] = center_id
            
            if gender:
                registered_query += " AND i.gender = :gender"
                params["gender"] = gender
            
            if age_group:
                min_birth_date, max_birth_date = cls._get_age_date_range(age_group)
                registered_query += """
                    AND i.date_of_birth IS NOT NULL
                    AND i.date_of_birth >= :min_birth_date 
                    AND i.date_of_birth <= :max_birth_date
                """
                params["min_birth_date"] = min_birth_date
                params["max_birth_date"] = max_birth_date
            
            registered_result = db.session.execute(
                text(registered_query),
                params
            ).fetchone()
            
            total_registered = registered_result[0] if registered_result else 0
            
            # Check-ins with event filter
            checkins_query = """
                SELECT COUNT(DISTINCT ar.individual_id) as total_check_ins
                FROM attendance_records ar
                JOIN individuals i ON ar.individual_id = i.individual_id
                JOIN households h ON i.household_id = h.household_id
                WHERE ar.status = 'checked_in'
            """
            checkins_params = {}
            
            if center_id:
                checkins_query += " AND ar.center_id = :center_id"
                checkins_params["center_id"] = center_id
            
            # NEW: Add event filter
            if event_id:
                checkins_query += " AND ar.event_id = :event_id"
                checkins_params["event_id"] = event_id
            
            if gender:
                checkins_query += " AND i.gender = :gender"
                checkins_params["gender"] = gender
            
            if age_group:
                min_birth_date, max_birth_date = cls._get_age_date_range(age_group)
                checkins_query += """
                    AND i.date_of_birth IS NOT NULL
                    AND i.date_of_birth >= :min_birth_date 
                    AND i.date_of_birth <= :max_birth_date
                """
                checkins_params["min_birth_date"] = min_birth_date
                checkins_params["max_birth_date"] = max_birth_date
            
            checkins_result = db.session.execute(
                text(checkins_query),
                checkins_params
            ).fetchone()
            
            total_check_ins = checkins_result[0] if checkins_result else 0
            
            percentage = 0
            if total_registered > 0:
                percentage = round((total_check_ins / total_registered) * 100, 2)
            
            return {
                "total_check_ins": total_check_ins,
                "total_registered": total_registered,
                "percentage": percentage
            }
            
        except Exception as error:
            logger.error("Error calculating registration stats: %s", str(error))
            return {
                "total_check_ins": 0,
                "total_registered": 0,
                "percentage": 0
            }

    @classmethod
    def get_aid_distribution_stats(
        cls,
        center_id: Optional[int] = None,
        event_id: Optional[int] = None,  # NEW
    ) -> Dict[str, Any]:
        try:
            # Get allocation-based statistics with event filter
            if event_id:
                if center_id:
                    allocation_query = text("""
                        SELECT 
                            COALESCE(SUM(total_quantity), 0) as total_allocated,
                            COALESCE(SUM(remaining_quantity), 0) as remaining,
                            COALESCE(SUM(total_quantity - remaining_quantity), 0) as calculated_distributed
                        FROM allocations 
                        WHERE center_id = :center_id 
                        AND event_id = :event_id
                        AND status IN ('active', 'depleted')
                    """)
                    params = {"center_id": center_id, "event_id": event_id}
                else:
                    allocation_query = text("""
                        SELECT 
                            COALESCE(SUM(total_quantity), 0) as total_allocated,
                            COALESCE(SUM(remaining_quantity), 0) as remaining,
                            COALESCE(SUM(total_quantity - remaining_quantity), 0) as calculated_distributed
                        FROM allocations 
                        WHERE event_id = :event_id
                        AND status IN ('active', 'depleted')
                    """)
                    params = {"event_id": event_id}
            else:
                # Original queries without event filter
                if center_id:
                    allocation_query = text("""
                        SELECT 
                            COALESCE(SUM(total_quantity), 0) as total_allocated,
                            COALESCE(SUM(remaining_quantity), 0) as remaining,
                            COALESCE(SUM(total_quantity - remaining_quantity), 0) as calculated_distributed
                        FROM allocations 
                        WHERE center_id = :center_id 
                        AND status IN ('active', 'depleted')
                    """)
                    params = {"center_id": center_id}
                else:
                    allocation_query = text("""
                        SELECT 
                            COALESCE(SUM(total_quantity), 0) as total_allocated,
                            COALESCE(SUM(remaining_quantity), 0) as remaining,
                            COALESCE(SUM(total_quantity - remaining_quantity), 0) as calculated_distributed
                        FROM allocations 
                        WHERE status IN ('active', 'depleted')
                    """)
                    params = {}

            allocation_result = db.session.execute(allocation_query, params).fetchone()
            
            # Get distribution-based statistics for verification with event filter
            if event_id:
                if center_id:
                    distribution_query = text("""
                        SELECT COALESCE(SUM(d.quantity_distributed), 0) as total_from_distributions
                        FROM distributions d
                        JOIN allocations a ON d.allocation_id = a.allocation_id
                        WHERE a.center_id = :center_id
                        AND a.event_id = :event_id
                        AND a.status IN ('active', 'depleted')
                    """)
                    dist_params = {"center_id": center_id, "event_id": event_id}
                else:
                    distribution_query = text("""
                        SELECT COALESCE(SUM(d.quantity_distributed), 0) as total_from_distributions
                        FROM distributions d
                        JOIN allocations a ON d.allocation_id = a.allocation_id
                        WHERE a.event_id = :event_id
                        AND a.status IN ('active', 'depleted')
                    """)
                    dist_params = {"event_id": event_id}
            else:
                # Original queries without event filter
                if center_id:
                    distribution_query = text("""
                        SELECT COALESCE(SUM(d.quantity_distributed), 0) as total_from_distributions
                        FROM distributions d
                        JOIN allocations a ON d.allocation_id = a.allocation_id
                        WHERE a.center_id = :center_id
                        AND a.status IN ('active', 'depleted')
                    """)
                    dist_params = {"center_id": center_id}
                else:
                    distribution_query = text("""
                        SELECT COALESCE(SUM(d.quantity_distributed), 0) as total_from_distributions
                        FROM distributions d
                        JOIN allocations a ON d.allocation_id = a.allocation_id
                        WHERE a.status IN ('active', 'depleted')
                    """)
                    dist_params = {}

            distribution_result = db.session.execute(distribution_query, dist_params).fetchone()
            
            if allocation_result:
                total_allocated = float(allocation_result[0])
                remaining = float(allocation_result[1])
                calculated_distributed = float(allocation_result[2])
            else:
                total_allocated = 0
                remaining = 0
                calculated_distributed = 0
            
            # Use the distributions table value as the primary source of truth
            total_distributed = float(distribution_result[0]) if distribution_result else calculated_distributed
            
            # Calculate percentage
            percentage = 0.0
            if total_allocated > 0:
                percentage = (total_distributed / total_allocated) * 100
            
            return {
                "total_distributed": int(total_distributed),
                "total_allocated": int(total_allocated),
                "remaining": int(remaining),
                "percentage": round(percentage, 2)
            }
            
        except Exception as error:
            logger.error("Error calculating aid distribution stats: %s", str(error))
            return {
                "total_distributed": 0,
                "total_allocated": 0,
                "remaining": 0,
                "percentage": 0
            }

    @classmethod
    def get_all_stats(
        cls,
        center_id: Optional[int] = None,
        gender: Optional[str] = None,
        age_group: Optional[str] = None,
        event_id: Optional[int] = None,  # NEW
    ) -> Dict[str, Any]:
        try:
            occupancy_stats = cls.get_occupancy_stats(center_id, gender, age_group, event_id)
            registration_stats = cls.get_registration_stats(center_id, gender, age_group, event_id)
            aid_distribution_stats = cls.get_aid_distribution_stats(center_id, event_id)
            
            return {
                "occupancy_stats": occupancy_stats,
                "registration_stats": registration_stats,
                "aid_distribution_stats": aid_distribution_stats
            }
            
        except Exception as error:
            logger.error("Error fetching all stats: %s", str(error))
            return {
                "occupancy_stats": {
                    "current_occupancy": 0,
                    "total_capacity": 0,
                    "percentage": 0
                },
                "registration_stats": {
                    "total_check_ins": 0,
                    "total_registered": 0,
                    "percentage": 0
                },
                "aid_distribution_stats": {
                    "total_distributed": 0,
                    "total_allocated": 0,
                    "percentage": 0
                }
            }