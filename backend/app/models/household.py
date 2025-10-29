from sqlalchemy import text
from app.models import db

class Household(db.Model):
    __tablename__ = "household"

    household_id = db.Column(db.Integer, primary_key=True)
    household_head_id = db.Column(db.Integer, db.ForeignKey('individual.individual_id'))
    center_id = db.Column(db.Integer, db.ForeignKey('evacuation_center.center_id'), nullable=False)
    household_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    @classmethod
    def get_all_paginated(cls, search: str, offset: int, limit: int):
        """
        Fetches a paginated list of households with search functionality.
        Joins with individual and evacuation_center to get head and center info.
        """
        search_query = f"%{search}%"
        
        sql = text("""
            SELECT
                h.household_id,
                h.household_name AS name,
                h.address,
                CONCAT(i.first_name, ' ', i.last_name) AS head,
                ec.address AS "evacCenter"  -- <-- THE FIX IS HERE
            FROM
                household h
            LEFT JOIN
                individual i ON h.household_head_id = i.individual_id
            LEFT JOIN
                evacuation_center ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.address ILIKE :search
            ORDER BY
                h.household_name
            LIMIT :limit OFFSET :offset
        """)

        result = db.session.execute(sql, {"search": search_query, "limit": limit, "offset": offset}).fetchall()
        return [dict(row._mapping) for row in result]

    @classmethod
    def get_count(cls, search: str):
        """
        Gets the total count of households matching a search query.
        """
        search_query = f"%{search}%"
        
        sql = text("""
            SELECT COUNT(h.household_id)
            FROM
                household h
            LEFT JOIN
                individual i ON h.household_head_id = i.individual_id
            LEFT JOIN
                evacuation_center ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.address ILIKE :search
        """)
        
        result = db.session.execute(sql, {"search": search_query}).scalar()
        return result if result is not None else 0