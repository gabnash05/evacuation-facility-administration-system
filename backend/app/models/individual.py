# FILE NAME: app/models/individual.py

from sqlalchemy import text
from app.models import db

class Individual(db.Model):
    __tablename__ = "individuals"

    individual_id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey('households.household_id'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(10))
    relationship_to_head = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # --- THIS IS THE CORRECTED METHOD ---
    @classmethod
    def get_by_household_id(cls, household_id: int):
        """Fetches all individuals for a given household, including their relationship."""
        sql = text("""
            SELECT 
                individual_id, 
                first_name, 
                last_name, 
                relationship_to_head 
            FROM individuals 
            WHERE household_id = :household_id 
            ORDER BY first_name
        """)
        result = db.session.execute(sql, {"household_id": household_id}).fetchall()
        return [dict(row._mapping) for row in result]

    @classmethod
    def create(cls, data: dict):
        """Creates a new individual record. Does not commit."""
        sql = text("""
            INSERT INTO individuals (household_id, first_name, last_name, relationship_to_head)
            VALUES (:household_id, :first_name, :last_name, :relationship_to_head)
            RETURNING *
        """)
        result = db.session.execute(sql, data).fetchone()
        return result._asdict() if result else None

    @classmethod
    def update(cls, individual_id: int, data: dict):
        """Updates a single individual record. Does not commit."""
        sql = text("""
            UPDATE individuals SET first_name = :first_name, last_name = :last_name, relationship_to_head = :relationship_to_head
            WHERE individual_id = :individual_id
        """)
        params = {**data, "individual_id": individual_id}
        db.session.execute(sql, params)

    @classmethod
    def delete_by_ids(cls, ids: list):
        """Deletes a list of individuals by their IDs. Does not commit."""
        if not ids:
            return
        sql = text("DELETE FROM individuals WHERE individual_id = ANY(:ids)")
        db.session.execute(sql, {'ids': ids})