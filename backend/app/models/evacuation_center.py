"""Evacuation Center model for EFAS."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.models import db
from app.schemas.evacuation_center import EvacuationCenterResponseSchema


class EvacuationCenter(db.Model):
    """Evacuation Center model for managing evacuation centers."""

    __tablename__ = "evacuation_centers"

    center_id = db.Column(db.Integer, primary_key=True)
    center_name = db.Column(db.String(255), nullable=False, index=True)
    address = db.Column(db.String(255), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")
    current_occupancy = db.Column(db.Integer, nullable=False, default=0)
    photo_data = db.Column(db.Text, nullable=True)  # Store base64 image data
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert center to dictionary for JSON serialization."""
        schema = EvacuationCenterResponseSchema()
        return schema.dump(self)

    def to_schema(self):
        """Convert center to Marshmallow response schema."""
        schema = EvacuationCenterResponseSchema()
        return schema.dump(self)

    def __repr__(self):
        return f"<EvacuationCenter(center_id={self.center_id}, name='{self.center_name}', status='{self.status}')>"

    @classmethod
    def _row_to_center(cls, row) -> Optional["EvacuationCenter"]:
        """Convert SQLAlchemy Row to EvacuationCenter object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_id(cls, center_id: int) -> Optional["EvacuationCenter"]:
        """Get center by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM evacuation_centers WHERE center_id = :center_id"),
            {"center_id": center_id},
        ).fetchone()

        return cls._row_to_center(result)

    @classmethod
    def get_all(
        cls,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
    ) -> Dict[str, Any]:
        # Base query
        base_query = "FROM evacuation_centers WHERE 1=1"
        count_query = "SELECT COUNT(*) as total_count FROM evacuation_centers WHERE 1=1"
        params = {}

        # Add search filter
        if search:
            base_query += " AND (LOWER(center_name) LIKE LOWER(:search) OR LOWER(address) LIKE LOWER(:search))"
            count_query += " AND (LOWER(center_name) LIKE LOWER(:search) OR LOWER(address) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"

        # Add status filter
        if status:
            base_query += " AND status = :status"
            count_query += " AND status = :status"
            params["status"] = status

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting - handle usage as a special case
        if sort_by == "usage":
            # Calculate usage percentage in the ORDER BY clause
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            select_query += f" ORDER BY (current_occupancy * 100.0 / NULLIF(capacity, 0)) {order_direction}"
        elif sort_by and sort_by in [
            "center_name",
            "address",
            "capacity",
            "current_occupancy",
            "status",
            "created_at",
        ]:
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY created_at DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        centers = [
            cls._row_to_center(row) for row in results if cls._row_to_center(row)
        ]

        return {
            "centers": centers,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

    @classmethod
    def get_all_centers_no_pagination(
        cls,
        search: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: Optional[str] = "center_name",
        sort_order: Optional[str] = "asc",
    ) -> Dict[str, Any]:
        """
        Get all evacuation centers without pagination for dropdowns and maps.

        Args:
            search: Optional search string for center name or address
            status: Optional status filter
            sort_by: Field to sort by (default: center_name)
            sort_order: Sort direction (asc/desc, default: asc)

        Returns:
            Dictionary containing:
                - centers: List of EvacuationCenter objects
                - total_count: Total number of centers
                - page: Always 1 (for consistency)
                - limit: Always total_count (for consistency)
                - total_pages: Always 1 (for consistency)
        """
        # Base query
        base_query = "FROM evacuation_centers WHERE 1=1"
        count_query = "SELECT COUNT(*) as total_count FROM evacuation_centers WHERE 1=1"
        params = {}

        # Add search filter
        if search:
            base_query += " AND (LOWER(center_name) LIKE LOWER(:search) OR LOWER(address) LIKE LOWER(:search))"
            count_query += " AND (LOWER(center_name) LIKE LOWER(:search) OR LOWER(address) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"

        # Add status filter
        if status:
            base_query += " AND status = :status"
            count_query += " AND status = :status"
            params["status"] = status

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "center_name",
            "address",
            "capacity",
            "current_occupancy",
            "status",
            "created_at",
        ]:
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += (
                " ORDER BY center_name ASC"  # Default sort for non-paginated
            )

        # Execute query (no pagination)
        results = db.session.execute(text(select_query), params).fetchall()

        centers = [
            cls._row_to_center(row) for row in results if cls._row_to_center(row)
        ]

        return {
            "centers": centers,
            "total_count": total_count,
            "page": 1,  # Always page 1 for consistency
            "limit": total_count,  # Limit equals total count for consistency
            "total_pages": 1,  # Always 1 page for consistency
        }

    @classmethod
    def create(cls, data: Dict[str, Any]) -> "EvacuationCenter":
        """Create a new evacuation center using raw SQL."""
        # Build the query dynamically to include photo_data if present
        fields = []
        values = []
        params = {}

        for field in [
            "center_name",
            "address",
            "capacity",
            "status",
            "current_occupancy",
            "photo_data",
        ]:
            if field in data and data[field] is not None:
                fields.append(field)
                values.append(f":{field}")
                params[field] = data[field]

        if not fields:
            raise ValueError("No data provided to create center")

        query = text(
            f"""  
            INSERT INTO evacuation_centers ({', '.join(fields)})
            VALUES ({', '.join(values)})
            RETURNING center_id, created_at, updated_at
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        result_dict = result._asdict()

        # Create center object with all data
        center_data = {**data, **result_dict}
        return cls(**center_data)

    @classmethod
    def update(
        cls, center_id: int, update_data: Dict[str, Any]
    ) -> Optional["EvacuationCenter"]:
        """Update center information using raw SQL."""
        # Build dynamic UPDATE query
        set_clauses = []
        params = {"center_id": center_id}

        for field, value in update_data.items():
            if field != "center_id":  # Prevent ID modification
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""  
            UPDATE evacuation_centers 
            SET {', '.join(set_clauses)}
            WHERE center_id = :center_id
            RETURNING *
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        return cls._row_to_center(result)

    @classmethod
    def delete(cls, center_id: int) -> bool:
        """Delete an evacuation center using raw SQL."""
        result = db.session.execute(
            text(
                """  
                DELETE FROM evacuation_centers
                WHERE center_id = :center_id 
                RETURNING center_id
                """
            ),
            {"center_id": center_id},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def update_occupancy(
        cls, center_id: int, new_occupancy: int
    ) -> Optional["EvacuationCenter"]:
        """Update current occupancy of a center with validation."""
        center = cls.get_by_id(center_id)
        if not center:
            return None

        if new_occupancy < 0:
            raise ValueError("Occupancy cannot be negative")

        return cls.update(center_id, {"current_occupancy": new_occupancy})
    
    @classmethod
    def get_city_summary(cls) -> Dict[str, Any]:
        """
        Get aggregated summary of all evacuation centers in Iligan City.
        
        Returns:
            Dictionary with:
                - total_capacity: Sum of all active centers' capacity
                - total_current_occupancy: Sum of all active centers' current_occupancy
                - usage_percentage: Calculated percentage
                - status: 'active' if any center is active, else 'inactive'
                - active_centers_count: Number of active centers
                - total_centers_count: Total number of centers
        """
        try:
            # Query to get aggregated data for active centers
            active_summary_query = text("""
                SELECT 
                    COUNT(*) as active_count,
                    COALESCE(SUM(capacity), 0) as total_capacity,
                    COALESCE(SUM(current_occupancy), 0) as total_occupancy
                FROM evacuation_centers
                WHERE status = 'active'
            """)
            
            active_result = db.session.execute(active_summary_query).fetchone()
            
            # Query to get total count of all centers
            total_count_query = text("""
                SELECT COUNT(*) as total_count
                FROM evacuation_centers
            """)
            
            total_result = db.session.execute(total_count_query).fetchone()
            
            # Extract values
            active_count = active_result[0] if active_result else 0
            total_capacity = active_result[1] if active_result else 0
            total_occupancy = active_result[2] if active_result else 0
            total_centers = total_result[0] if total_result else 0
            
            # Calculate usage percentage
            usage_percentage = 0
            if total_capacity > 0:
                usage_percentage = round((total_occupancy / total_capacity) * 100)
            
            # Determine overall status
            overall_status = "active" if active_count > 0 else "inactive"
            
            return {
                "total_capacity": total_capacity,
                "total_current_occupancy": total_occupancy,
                "usage_percentage": usage_percentage,
                "status": overall_status,
                "active_centers_count": active_count,
                "total_centers_count": total_centers,
            }
            
        except Exception as error:
            logger.error("Error getting city summary: %s", str(error))
            return {
                "total_capacity": 0,
                "total_current_occupancy": 0,
                "usage_percentage": 0,
                "status": "inactive",
                "active_centers_count": 0,
                "total_centers_count": 0,
            }
        
        
