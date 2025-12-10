"""Individual model."""
from sqlalchemy import text
from app.models import db
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class Individual(db.Model):
    __tablename__ = "individuals"

    individual_id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(
        db.Integer, db.ForeignKey("households.household_id"), nullable=False
    )
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(10))
    relationship_to_head = db.Column(db.String(50), nullable=False)
    current_status = db.Column(db.String(20))  # NEW: Real-time status field
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Add a property to get full name
    @property
    def full_name(self):
        """Return the full name of the individual."""
        return f"{self.first_name} {self.last_name}".strip()

    @classmethod
    def get_by_id(cls, individual_id: int):
        """Get individual by ID with household data and current status."""
        sql = text("""
            SELECT 
                i.individual_id, i.household_id, i.first_name, i.last_name, 
                i.date_of_birth, i.gender, i.relationship_to_head,
                i.current_status, i.created_at, i.updated_at,
                -- Household data
                h.household_id AS household_household_id,
                h.household_name AS household_household_name,
                h.address AS household_address,
                h.center_id AS household_center_id,
                h.household_head_id AS household_household_head_id,
                h.created_at AS household_created_at,
                h.updated_at AS household_updated_at,
                -- Current center info (if checked in)
                CASE 
                    WHEN i.current_status = 'checked_in' THEN 
                        (SELECT center_id FROM attendance_records 
                         WHERE individual_id = i.individual_id 
                         AND status = 'checked_in' 
                         AND check_out_time IS NULL 
                         LIMIT 1)
                    ELSE NULL
                END as current_center_id,
                
                CASE 
                    WHEN i.current_status = 'checked_in' THEN 
                        (SELECT ec.center_name FROM attendance_records ar
                         JOIN evacuation_centers ec ON ar.center_id = ec.center_id
                         WHERE ar.individual_id = i.individual_id 
                         AND ar.status = 'checked_in' 
                         AND ar.check_out_time IS NULL 
                         LIMIT 1)
                    ELSE NULL
                END as current_center_name,
                
                -- Last check-in time
                (SELECT check_in_time FROM attendance_records 
                WHERE individual_id = i.individual_id 
                AND check_in_time IS NOT NULL
                ORDER BY check_in_time DESC 
                LIMIT 1) as last_check_in_time,
                 
                -- Age (calculated)
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) as age
            FROM individuals i
            LEFT JOIN households h ON i.household_id = h.household_id
            WHERE i.individual_id = :id
        """)
        
        try:
            result = db.session.execute(sql, {"id": individual_id}).fetchone()
            if not result:
                return None
                
            return cls._map_individual_result(result)
            
        except Exception as e:
            logger.error(f"Error fetching individual by ID {individual_id}: {str(e)}")
            return None

    @classmethod
    def get_by_household_id(cls, household_id: int):
        """Get all individuals for a specific household with current status."""
        sql = text("""
            SELECT 
                individual_id, household_id, first_name, last_name, 
                date_of_birth, gender, relationship_to_head,
                current_status, created_at, updated_at
            FROM individuals 
            WHERE household_id = :household_id 
            ORDER BY 
                CASE WHEN LOWER(relationship_to_head) = 'head' THEN 1 ELSE 2 END,
                first_name
        """)
        
        try:
            result = db.session.execute(sql, {"household_id": household_id}).fetchall()
            return [dict(row._mapping) for row in result]
        except Exception as e:
            logger.error(f"Error fetching individuals for household {household_id}: {str(e)}")
            return []

    @classmethod
    def create(cls, data: dict):
        """Create a new individual."""
        sql = text("""
            INSERT INTO individuals (household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, current_status)
            VALUES (:household_id, :first_name, :last_name, :date_of_birth, :gender, :relationship_to_head, 'checked_out')
            RETURNING individual_id, household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, current_status, created_at, updated_at
        """)
        
        params = {
            "household_id": data.get("household_id"),
            "first_name": data.get("first_name", "").strip(),
            "last_name": data.get("last_name", "").strip(),
            "date_of_birth": data.get("date_of_birth"),
            "gender": data.get("gender"),
            "relationship_to_head": data.get("relationship_to_head", "").strip(),
        }
        
        try:
            result = db.session.execute(sql, params).fetchone()
            return dict(result._mapping) if result else None
        except Exception as e:
            logger.error(f"Error creating individual: {str(e)}")
            db.session.rollback()
            return None

    @classmethod
    def update(cls, individual_id: int, data: dict):
        """Update an existing individual."""
        sql = text("""
            UPDATE individuals 
            SET 
                first_name = COALESCE(:first_name, first_name), 
                last_name = COALESCE(:last_name, last_name), 
                date_of_birth = COALESCE(:date_of_birth, date_of_birth),
                gender = COALESCE(:gender, gender),
                relationship_to_head = COALESCE(:relationship_to_head, relationship_to_head),
                updated_at = CURRENT_TIMESTAMP
            WHERE individual_id = :individual_id
            RETURNING individual_id, household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, current_status, created_at, updated_at
        """)
        
        params = {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "date_of_birth": data.get("date_of_birth"),
            "gender": data.get("gender"),
            "relationship_to_head": data.get("relationship_to_head"),
            "individual_id": individual_id,
        }
        
        try:
            result = db.session.execute(sql, params).fetchone()
            return dict(result._mapping) if result else None
        except Exception as e:
            logger.error(f"Error updating individual {individual_id}: {str(e)}")
            db.session.rollback()
            return None

    @classmethod
    def delete_by_ids(cls, ids: list):
        """Delete multiple individuals by IDs."""
        if not ids:
            return 0
            
        sql = text("""
            DELETE FROM individuals 
            WHERE individual_id = ANY(:ids) 
            RETURNING individual_id
        """)
        
        try:
            result = db.session.execute(sql, {"ids": ids}).fetchall()
            return len(result)
        except Exception as e:
            logger.error(f"Error deleting individuals {ids}: {str(e)}")
            db.session.rollback()
            return 0

    @classmethod
    def get_all_paginated(
        cls,
        search: str = "",
        offset: int = 0,
        limit: int = 10,
        sort_by: str = "last_name",
        sort_direction: str = "asc",
        household_id: int = None,
        status: str = None,
        gender: str = None,
        age_group: str = None,
        center_id: int = None,
    ):
        """Get paginated individuals with filtering and sorting, including real-time status."""
        search_query = f"%{search}%" if search else ""
        
        # Define allowed sort columns with their corresponding SQL expressions
        allowed_sort_columns = {
            "first_name": "i.first_name",
            "last_name": "i.last_name",
            "full_name": "i.first_name, i.last_name",
            "date_of_birth": "i.date_of_birth",
            "gender": "i.gender",
            "relationship_to_head": "i.relationship_to_head",
            "current_status": "i.current_status",
            "current_center": "current_center_name",
            "household": "h.household_name",
            "last_check_in_time": "last_check_in_time",
            "created_at": "i.created_at",
            "updated_at": "i.updated_at",
            "age": "age",
        }
        
        # Validate and set sort column
        sort_column = allowed_sort_columns.get(sort_by, "i.last_name")
        if sort_direction.lower() not in ["asc", "desc"]:
            sort_direction = "asc"
        order_by_clause = f"ORDER BY {sort_column} {sort_direction}"

        # Build WHERE conditions
        conditions = ["(:search = '' OR i.first_name ILIKE :search OR i.last_name ILIKE :search OR CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR i.relationship_to_head ILIKE :search OR h.household_name ILIKE :search)"]
        params = {"search": search_query, "limit": limit, "offset": offset}

        if household_id:
            conditions.append("i.household_id = :household_id")
            params["household_id"] = household_id

        if status and status != "all":
            conditions.append("i.current_status = :status")
            params["status"] = status

        if gender and gender != "all":
            conditions.append("i.gender = :gender")
            params["gender"] = gender

        if age_group and age_group != "all":
            age_conditions = {
                "child": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) < 18",
                "young_adult": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 18 AND 34",
                "middle_aged": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 35 AND 59",
                "senior": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) >= 60"
            }
            if age_group in age_conditions:
                conditions.append(age_conditions[age_group])

        # MODIFIED: Center filter - show individuals with center_id OR currently checked into center
        if center_id:
            conditions.append("""
                (
                    -- Individuals currently checked into this center
                    EXISTS (
                        SELECT 1 FROM attendance_records ar
                        WHERE ar.individual_id = i.individual_id
                        AND ar.status = 'checked_in'
                        AND ar.check_out_time IS NULL
                        AND ar.center_id = :center_id
                    )
                    -- OR individuals associated with a household registered to this center
                    OR h.center_id = :center_id
                    -- NEW: OR individuals transferred FROM this center AND NOT checked into the destination center yet
                    OR EXISTS (
                        SELECT 1 FROM attendance_records ar_transfer
                        WHERE ar_transfer.individual_id = i.individual_id
                        AND ar_transfer.status = 'transferred'
                        AND ar_transfer.transfer_from_center_id = :center_id
                        -- Ensure they haven't been checked into the destination center since transfer
                        AND NOT EXISTS (
                            SELECT 1 FROM attendance_records ar_checkin
                            WHERE ar_checkin.individual_id = i.individual_id
                            AND ar_checkin.status = 'checked_in'
                            AND ar_checkin.check_out_time IS NULL
                            AND ar_checkin.center_id = ar_transfer.transfer_to_center_id
                        )
                    )
                )
            """)
            params["center_id"] = center_id

        where_clause = " AND ".join(conditions)

        sql_query = f"""
                SELECT
                    i.individual_id,
                    i.household_id,
                    i.first_name,
                    i.last_name,
                    i.date_of_birth,
                    i.gender,
                    i.relationship_to_head,
                    i.current_status,
                    i.created_at,
                    i.updated_at,
                    -- Household data
                    h.household_id AS household_household_id,
                    h.household_name AS household_household_name,
                    h.address AS household_address,
                    h.center_id AS household_center_id,
                    h.household_head_id AS household_household_head_id,
                    h.created_at AS household_created_at,
                    h.updated_at AS household_updated_at,
                    -- Current center info (if checked in)
                    CASE 
                        WHEN i.current_status = 'checked_in' THEN 
                            (SELECT center_id FROM attendance_records 
                            WHERE individual_id = i.individual_id 
                            AND status = 'checked_in' 
                            AND check_out_time IS NULL 
                            LIMIT 1)
                        ELSE NULL
                    END as current_center_id,
                    
                    CASE 
                        WHEN i.current_status = 'checked_in' THEN 
                            (SELECT ec.center_name FROM attendance_records ar
                            JOIN evacuation_centers ec ON ar.center_id = ec.center_id
                            WHERE ar.individual_id = i.individual_id 
                            AND ar.status = 'checked_in' 
                            AND ar.check_out_time IS NULL 
                            LIMIT 1)
                        ELSE NULL
                    END as current_center_name,
                    
                    -- Last check-in time
                    (SELECT check_in_time FROM attendance_records 
                    WHERE individual_id = i.individual_id 
                    AND check_in_time IS NOT NULL
                    ORDER BY check_in_time DESC 
                    LIMIT 1) as last_check_in_time,
                    
                    -- Age (calculated)
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) as age,
                    
                    -- Age group
                    CASE 
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) < 18 THEN 'Children'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 18 AND 34 THEN 'Young Adult'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 35 AND 59 THEN 'Middle Aged'
                        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) >= 60 THEN 'Senior'
                        ELSE 'Unknown'
                    END as age_group
                FROM
                    individuals i
                LEFT JOIN
                    households h ON i.household_id = h.household_id
                WHERE
                    {where_clause}
                {order_by_clause}
                LIMIT :limit OFFSET :offset
            """
        
        try:
            result = db.session.execute(text(sql_query), params).fetchall()
            individuals = [cls._map_individual_result(row) for row in result]
            
            return individuals
            
        except Exception as e:
            logger.error(f"Error fetching paginated individuals: {str(e)}")
            return []
        
    @classmethod
    def get_count(
        cls, 
        search: str = "", 
        household_id: int = None, 
        status: str = None,
        gender: str = None,
        age_group: str = None,
        center_id: int = None
    ):
        """Get total count of individuals matching search criteria with filters."""
        search_query = f"%{search}%" if search else ""

        # Build WHERE conditions
        conditions = ["(:search = '' OR i.first_name ILIKE :search OR i.last_name ILIKE :search OR CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR i.relationship_to_head ILIKE :search OR h.household_name ILIKE :search)"]
        params = {"search": search_query}

        if household_id:
            conditions.append("i.household_id = :household_id")
            params["household_id"] = household_id

        if status and status != "all":
            conditions.append("i.current_status = :status")
            params["status"] = status

        if gender and gender != "all":
            conditions.append("i.gender = :gender")
            params["gender"] = gender

        if age_group and age_group != "all":
            age_conditions = {
                "child": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) < 18",
                "young_adult": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 18 AND 34",
                "middle_aged": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) BETWEEN 35 AND 59",
                "senior": "EXTRACT(YEAR FROM AGE(CURRENT_DATE, i.date_of_birth)) >= 60"
            }
            if age_group in age_conditions:
                conditions.append(age_conditions[age_group])

        if center_id:
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM attendance_records ar
                    WHERE ar.individual_id = i.individual_id
                    AND ar.status = 'checked_in'
                    AND ar.check_out_time IS NULL
                    AND ar.center_id = :center_id
                )
            """)
            params["center_id"] = center_id

        where_clause = " AND ".join(conditions)

        sql = text(f"""
            SELECT COUNT(i.individual_id)
            FROM individuals i
            LEFT JOIN households h ON i.household_id = h.household_id
            WHERE {where_clause}
        """)

        try:
            result = db.session.execute(sql, params).scalar()
            return result if result is not None else 0
        except Exception as e:
            logger.error(f"Error counting individuals: {str(e)}")
            return 0

    @classmethod
    def search_by_name(cls, name: str, limit: int = 10):
        """Search individuals by name (first, last, or full name)."""
        if not name or not name.strip():
            return []
            
        search_term = f"%{name.strip()}%"
        
        sql = text("""
            SELECT 
                individual_id, household_id, first_name, last_name, 
                date_of_birth, gender, relationship_to_head,
                current_status, created_at, updated_at
            FROM individuals 
            WHERE 
                first_name ILIKE :search OR
                last_name ILIKE :search OR
                CONCAT(first_name, ' ', last_name) ILIKE :search
            ORDER BY 
                first_name, last_name
            LIMIT :limit
        """)
        
        try:
            result = db.session.execute(sql, {"search": search_term, "limit": limit}).fetchall()
            individuals = [dict(row._mapping) for row in result]
            
            # Add full_name to each individual
            for individual in individuals:
                individual['full_name'] = f"{individual['first_name']} {individual['last_name']}"
                
            return individuals
        except Exception as e:
            logger.error(f"Error searching individuals by name '{name}': {str(e)}")
            return []

    @classmethod
    def get_individuals_with_status_summary(
        cls,
        center_id: int = None,
        event_id: int = None
    ):
        """Get summary of individuals grouped by current status."""
        base_conditions = []
        params = {}
        
        if center_id:
            base_conditions.append("""
                EXISTS (
                    SELECT 1 FROM attendance_records ar
                    WHERE ar.individual_id = i.individual_id
                    AND ar.status = 'checked_in'
                    AND ar.check_out_time IS NULL
                    AND ar.center_id = :center_id
                )
            """)
            params["center_id"] = center_id
            
        if event_id:
            base_conditions.append("""
                EXISTS (
                    SELECT 1 FROM attendance_records ar
                    WHERE ar.individual_id = i.individual_id
                    AND ar.event_id = :event_id
                )
            """)
            params["event_id"] = event_id
        
        where_clause = " AND ".join(base_conditions) if base_conditions else "1=1"
        
        sql = text(f"""
            SELECT 
                current_status,
                COUNT(*) as count,
                COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
                COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count,
                COUNT(CASE WHEN gender = 'Other' THEN 1 END) as other_count,
                COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 18 THEN 1 END) as child_count,
                COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 59 THEN 1 END) as adult_count,
                COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) >= 60 THEN 1 END) as senior_count
            FROM individuals i
            WHERE {where_clause}
            GROUP BY current_status
            ORDER BY 
                CASE 
                    WHEN current_status = 'checked_in' THEN 1
                    WHEN current_status = 'checked_out' THEN 2
                    WHEN current_status = 'transferred' THEN 3
                    ELSE 4
                END
        """)
        
        try:
            result = db.session.execute(sql, params).fetchall()
            summary = {}
            
            for row in result:
                status = row.current_status or "unknown"
                summary[status] = {
                    "count": row.count,
                    "gender_breakdown": {
                        "male": row.male_count or 0,
                        "female": row.female_count or 0,
                        "other": row.other_count or 0
                    },
                    "age_breakdown": {
                        "child": row.child_count or 0,
                        "adult": row.adult_count or 0,
                        "senior": row.senior_count or 0
                    }
                }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting individuals status summary: {str(e)}")
            return {}

    @classmethod
    def recalculate_all_statuses(cls):
        """Recalculate current_status for all individuals (for data integrity)."""
        sql = text("SELECT * FROM recalculate_all_individual_statuses()")
        
        try:
            result = db.session.execute(sql).fetchall()
            updates = [
                {
                    "individual_id": row.individual_id,
                    "old_status": row.old_status,
                    "new_status": row.new_status
                }
                for row in result
            ]
            
            logger.info(f"Recalculated statuses for {len(updates)} individuals")
            return updates
            
        except Exception as e:
            logger.error(f"Error recalculating individual statuses: {str(e)}")
            return []

    @classmethod
    def get_current_center_for_individual(cls, individual_id: int):
        """Get current center info for an individual if checked in."""
        sql = text("""
            SELECT 
                ec.center_id,
                ec.center_name,
                ec.address,
                ec.current_occupancy,
                ar.check_in_time
            FROM attendance_records ar
            JOIN evacuation_centers ec ON ar.center_id = ec.center_id
            WHERE ar.individual_id = :individual_id
            AND ar.status = 'checked_in'
            AND ar.check_out_time IS NULL
            LIMIT 1
        """)
        
        try:
            result = db.session.execute(sql, {"individual_id": individual_id}).fetchone()
            if result:
                return {
                    "center_id": result.center_id,
                    "center_name": result.center_name,
                    "address": result.address,
                    "current_occupancy": result.current_occupancy,
                    "check_in_time": result.check_in_time.isoformat() if result.check_in_time else None
                }
            return None
        except Exception as e:
            logger.error(f"Error getting current center for individual {individual_id}: {str(e)}")
            return None

    @classmethod
    def get_attendance_history_summary(cls, individual_id: int):
        """Get summary of attendance history for an individual."""
        sql = text("""
            SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as check_in_count,
                COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as check_out_count,
                COUNT(CASE WHEN status = 'transferred' THEN 1 END) as transfer_count,
                MIN(check_in_time) as first_check_in,
                MAX(check_in_time) as last_check_in
            FROM attendance_records
            WHERE individual_id = :individual_id
        """)
        
        try:
            result = db.session.execute(sql, {"individual_id": individual_id}).fetchone()
            if result:
                return {
                    "total_records": result.total_records or 0,
                    "check_in_count": result.check_in_count or 0,
                    "check_out_count": result.check_out_count or 0,
                    "transfer_count": result.transfer_count or 0,
                    "first_check_in": result.first_check_in.isoformat() if result.first_check_in else None,
                    "last_check_in": result.last_check_in.isoformat() if result.last_check_in else None
                }
            return None
        except Exception as e:
            logger.error(f"Error getting attendance history summary for individual {individual_id}: {str(e)}")
            return None

    @classmethod
    def _map_individual_result(cls, result_row):
        """Helper method to map SQL result to individual object."""
        row_dict = dict(result_row._mapping)
        
        # Build nested household object
        household = None
        if row_dict.get("household_household_id"):
            household = {
                "household_id": row_dict["household_household_id"],
                "household_name": row_dict["household_household_name"],
                "address": row_dict["household_address"],
                "center_id": row_dict["household_center_id"],
                "household_head_id": row_dict["household_household_head_id"],
                "created_at": row_dict["household_created_at"],
                "updated_at": row_dict["household_updated_at"],
            }
        
        # Calculate age group if not already in result
        age = row_dict.get("age")
        if age is not None:
            if age < 18:
                age_group = "Children"
            elif age >= 18 and age < 35:
                age_group = "Young Adult"
            elif age >= 35 and age <= 59:
                age_group = "Middle Aged"
            else:
                age_group = "Senior"
        else:
            age_group = row_dict.get("age_group", "Unknown")
        
        # Build individual object with nested household
        individual = {
            "individual_id": row_dict["individual_id"],
            "household_id": row_dict["household_id"],
            "first_name": row_dict["first_name"],
            "last_name": row_dict["last_name"],
            "date_of_birth": row_dict["date_of_birth"],
            "gender": row_dict["gender"],
            "relationship_to_head": row_dict["relationship_to_head"],
            "current_status": row_dict["current_status"],
            "created_at": row_dict["created_at"],
            "updated_at": row_dict["updated_at"],
            "household": household,
            "full_name": f"{row_dict['first_name']} {row_dict['last_name']}",
            "current_center_id": row_dict.get("current_center_id"),
            "current_center_name": row_dict.get("current_center_name"),
            "last_check_in_time": row_dict.get("last_check_in_time"),
            "age": age,
            "age_group": age_group
        }
        
        return individual