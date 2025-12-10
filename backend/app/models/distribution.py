from sqlalchemy import text
from app.models import db

class Distribution(db.Model):
    """
    Read-only model for viewing distribution history.
    """
    __tablename__ = "distributions"

    distribution_id = db.Column(db.Integer, primary_key=True)
    # We don't need to define all columns here since we use raw SQL for complex joins

    @classmethod
    def get_history_paginated(cls, center_id=None, search=None, page=1, limit=10):
        offset = (page - 1) * limit
        
        # Base query: Join Distributions -> Session -> Household -> User -> Allocation
        # We fetch "One Row Per Item" because that's how the History Table displays it.
        base_query = """
            FROM distributions d
            JOIN distribution_sessions ds ON d.session_id = ds.session_id
            JOIN households h ON ds.household_id = h.household_id
            JOIN users u ON ds.distributed_by_user_id = u.user_id
            JOIN allocations a ON d.allocation_id = a.allocation_id
            WHERE 1=1
        """
        
        params = {"limit": limit, "offset": offset}

        # Filter by Center (Volunteers/Center Admins only see their center)
        if center_id:
            base_query += " AND ds.center_id = :center_id"
            params["center_id"] = center_id
            
        # Filter by Search (Household Name or Item Name)
        if search:
            base_query += " AND (h.household_name ILIKE :search OR a.resource_name ILIKE :search)"
            params["search"] = f"%{search}%"

        # 1. Get Total Count (for Pagination)
        count_sql = text(f"SELECT COUNT(*) {base_query}")
        total_count = db.session.execute(count_sql, params).scalar()

        # 2. Get Actual Data
        data_sql = text(f"""
            SELECT 
                d.distribution_id, 
                ds.created_at as distribution_date,
                h.household_name,
                u.email as volunteer_name,
                a.resource_name,
                d.quantity_distributed as quantity
            {base_query}
            ORDER BY ds.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        results = db.session.execute(data_sql, params).fetchall()
        
        # Convert rows to list of dicts
        data = []
        for row in results:
            data.append({
                "distribution_id": row.distribution_id,
                "distribution_date": row.distribution_date.isoformat() if row.distribution_date else None,
                "household_name": row.household_name,
                "volunteer_name": row.volunteer_name,
                "resource_name": row.resource_name,
                "quantity": row.quantity
            })

        return {
            "data": data,
            "total": total_count,
            "page": page,
            "limit": limit
        }