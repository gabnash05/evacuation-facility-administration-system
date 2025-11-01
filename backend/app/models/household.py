from sqlalchemy import text
from app.models import db

class Household(db.Model):
    __tablename__ = "households"

    household_id = db.Column(db.Integer, primary_key=True)
    # ... other columns ...

    @classmethod
    def get_all_paginated(cls, search: str, offset: int, limit: int, sort_by: str, sort_direction: str):
        """
        Fetches a paginated AND SORTED list of households.
        """
        search_query = f"%{search}%"
        
        
        allowed_sort_columns = {
            "name": "h.household_name",
            "head": "head",
            "address": "h.address",
            "evacCenter": "evacCenter"
        }
        
        sort_column = allowed_sort_columns.get(sort_by, "h.household_name")
        
        if sort_direction.lower() not in ['asc', 'desc']:
            sort_direction = 'asc'
        
        order_by_clause = f"ORDER BY {sort_column} {sort_direction}"
        
        
        sql_query = f"""
            SELECT
                h.household_id,
                h.household_name AS name,
                h.address,
                CONCAT(i.first_name, ' ', i.last_name) AS head,
                ec.address AS "evacCenter"
            FROM
                households h
            LEFT JOIN
                individuals i ON h.household_head_id = i.individual_id
            LEFT JOIN
                evacuation_centers ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.address ILIKE :search
            {order_by_clause} -- Dynamically insert the ORDER BY clause here
            LIMIT :limit OFFSET :offset
        """

        result = db.session.execute(text(sql_query), {"search": search_query, "limit": limit, "offset": offset}).fetchall()
        return [dict(row._mapping) for row in result]

    @classmethod
    def get_count(cls, search: str):
        search_query = f"%{search}%"
        sql = text("""
            SELECT COUNT(h.household_id)
            FROM households h
            LEFT JOIN individuals i ON h.household_head_id = i.individual_id
            LEFT JOIN evacuation_centers ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.address ILIKE :search
        """)
        result = db.session.execute(sql, {"search": search_query}).scalar()
        return result if result is not None else 0