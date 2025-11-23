"""Individual model."""
from sqlalchemy import text
from app.models import db
import logging

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
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Add a property to get full name
    @property
    def full_name(self):
        """Return the full name of the individual."""
        return f"{self.first_name} {self.last_name}".strip()

    @classmethod
    def get_by_id(cls, individual_id: int):
        """Get individual by ID with household data."""
        sql = text("""
            SELECT 
                i.individual_id, i.household_id, i.first_name, i.last_name, 
                i.date_of_birth, i.gender, i.relationship_to_head,
                i.created_at, i.updated_at,
                -- Household data
                h.household_id AS household_household_id,
                h.household_name AS household_household_name,
                h.address AS household_address,
                h.center_id AS household_center_id,
                h.household_head_id AS household_household_head_id,
                h.created_at AS household_created_at,
                h.updated_at AS household_updated_at
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
        """Get all individuals for a specific household."""
        sql = text("""
            SELECT 
                individual_id, household_id, first_name, last_name, 
                date_of_birth, gender, relationship_to_head,
                created_at, updated_at
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
            INSERT INTO individuals (household_id, first_name, last_name, date_of_birth, gender, relationship_to_head)
            VALUES (:household_id, :first_name, :last_name, :date_of_birth, :gender, :relationship_to_head)
            RETURNING individual_id, household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, created_at, updated_at
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
            RETURNING individual_id, household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, created_at, updated_at
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
    ):
        """Get paginated individuals with filtering and sorting."""
        search_query = f"%{search}%" if search else ""
        
        # Define allowed sort columns with their corresponding SQL expressions
        allowed_sort_columns = {
            "first_name": "i.first_name",
            "last_name": "i.last_name",
            "full_name": "i.first_name, i.last_name",  # Added full name sorting
            "date_of_birth": "i.date_of_birth",
            "gender": "i.gender",
            "relationship_to_head": "i.relationship_to_head",
            "household": "h.household_name",
            "created_at": "i.created_at",
            "updated_at": "i.updated_at",
        }
        
        # Validate and set sort column
        sort_column = allowed_sort_columns.get(sort_by, "i.last_name")
        if sort_direction.lower() not in ["asc", "desc"]:
            sort_direction = "asc"
        order_by_clause = f"ORDER BY {sort_column} {sort_direction}"

        # Add household filter condition
        household_filter = ""
        if household_id:
            household_filter = "AND i.household_id = :household_id"

        sql_query = f"""
            SELECT
                i.individual_id,
                i.household_id,
                i.first_name,
                i.last_name,
                i.date_of_birth,
                i.gender,
                i.relationship_to_head,
                i.created_at,
                i.updated_at,
                -- Household data
                h.household_id AS household_household_id,
                h.household_name AS household_household_name,
                h.address AS household_address,
                h.center_id AS household_center_id,
                h.household_head_id AS household_household_head_id,
                h.created_at AS household_created_at,
                h.updated_at AS household_updated_at
            FROM
                individuals i
            LEFT JOIN
                households h ON i.household_id = h.household_id
            WHERE
                (:search = '' OR 
                i.first_name ILIKE :search OR
                i.last_name ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                i.relationship_to_head ILIKE :search OR
                h.household_name ILIKE :search)
                {household_filter}
            {order_by_clause}
            LIMIT :limit OFFSET :offset
        """

        params = {"search": search_query, "limit": limit, "offset": offset}
        if household_id:
            params["household_id"] = household_id

        try:
            result = db.session.execute(text(sql_query), params).fetchall()
            individuals = [cls._map_individual_result(row) for row in result]
            
            logger.debug(f"Fetched {len(individuals)} individuals")
            return individuals
            
        except Exception as e:
            logger.error(f"Error fetching paginated individuals: {str(e)}")
            return []

    @classmethod
    def get_count(cls, search: str = "", household_id: int = None):
        """Get total count of individuals matching search criteria."""
        search_query = f"%{search}%" if search else ""

        # Add household filter condition
        household_filter = ""
        if household_id:
            household_filter = "AND i.household_id = :household_id"

        sql = text(f"""
            SELECT COUNT(i.individual_id)
            FROM individuals i
            LEFT JOIN households h ON i.household_id = h.household_id
            WHERE
                (:search = '' OR
                i.first_name ILIKE :search OR
                i.last_name ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                i.relationship_to_head ILIKE :search OR
                h.household_name ILIKE :search)
                {household_filter}
        """)

        params = {"search": search_query}
        if household_id:
            params["household_id"] = household_id

        try:
            result = db.session.execute(sql, params).scalar()
            return result if result is not None else 0
        except Exception as e:
            logger.error(f"Error counting individuals: {str(e)}")
            return 0

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
        
        # Build individual object with nested household
        individual = {
            "individual_id": row_dict["individual_id"],
            "household_id": row_dict["household_id"],
            "first_name": row_dict["first_name"],
            "last_name": row_dict["last_name"],
            "date_of_birth": row_dict["date_of_birth"],
            "gender": row_dict["gender"],
            "relationship_to_head": row_dict["relationship_to_head"],
            "created_at": row_dict["created_at"],
            "updated_at": row_dict["updated_at"],
            "household": household,
            "full_name": f"{row_dict['first_name']} {row_dict['last_name']}",  # Add full_name for convenience
        }
        
        return individual

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
                created_at, updated_at
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