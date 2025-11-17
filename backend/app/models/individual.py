from sqlalchemy import text
from app.models import db


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

    @classmethod
    def get_by_household_id(cls, household_id: int):
        sql = text(
            """
            SELECT 
                individual_id, first_name, last_name, 
                date_of_birth, gender, relationship_to_head 
            FROM individuals 
            WHERE household_id = :household_id 
            ORDER BY first_name
        """
        )
        result = db.session.execute(sql, {"household_id": household_id}).fetchall()
        return [dict(row._mapping) for row in result]

    @classmethod
    def create(cls, data: dict):
        sql = text(
            """
            INSERT INTO individuals (household_id, first_name, last_name, date_of_birth, gender, relationship_to_head)
            VALUES (:household_id, :first_name, :last_name, :date_of_birth, :gender, :relationship_to_head)
            RETURNING *
        """
        )
        params = {
            "household_id": data.get("household_id"),
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "date_of_birth": data.get("date_of_birth"),
            "gender": data.get("gender"),
            "relationship_to_head": data.get("relationship_to_head"),
        }
        result = db.session.execute(sql, params).fetchone()
        db.session.commit()
        return result._asdict() if result else None

    @classmethod
    def update(cls, individual_id: int, data: dict):
        sql = text(
            """
            UPDATE individuals 
            SET 
                first_name = :first_name, 
                last_name = :last_name, 
                date_of_birth = :date_of_birth,
                gender = :gender,
                relationship_to_head = :relationship_to_head
            WHERE individual_id = :individual_id
        """
        )
        params = {**data, "individual_id": individual_id}
        result = db.session.execute(sql, params)
        db.session.commit()
        # Try to return the updated row
        updated = db.session.execute(
            text("SELECT * FROM individuals WHERE individual_id = :id"),
            {"id": individual_id},
        ).fetchone()
        return updated._asdict() if updated else None

    @classmethod
    def delete_by_ids(cls, ids: list):
        if not ids:
            return
        sql = text("DELETE FROM individuals WHERE individual_id = ANY(:ids) RETURNING individual_id")
        result = db.session.execute(sql, {"ids": ids}).fetchall()
        db.session.commit()
        return [row[0] for row in result] if result else []
