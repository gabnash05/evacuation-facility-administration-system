from sqlalchemy import text
from app.models import db


class Event(db.Model):
    __tablename__ = "events"

    event_id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(150), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    date_declared = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = db.Column(
        db.DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP")
    )

    @classmethod
    def get_all(cls):
        result = db.session.execute(text("SELECT * FROM events ORDER BY date_declared DESC"))
        return [dict(row._mapping) for row in result.fetchall()]

    @classmethod
    def get_by_id(cls, event_id):
        result = db.session.execute(
            text("SELECT * FROM events WHERE event_id = :event_id"),
            {"event_id": event_id}
        ).fetchone()
        return dict(result._mapping) if result else None

    @classmethod
    def create(cls, data):
        query = text("""
            INSERT INTO events (event_name, event_type, date_declared, end_date, status)
            VALUES (:event_name, :event_type, :date_declared, :end_date, :status)
            RETURNING *;
        """)
        result = db.session.execute(query, data).fetchone()
        db.session.commit()
        return dict(result._mapping)

    @classmethod
    def update(cls, event_id, data):
        query = text("""
            UPDATE events
            SET event_name = :event_name,
                event_type = :event_type,
                date_declared = :date_declared,
                end_date = :end_date,
                status = :status,
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = :event_id
            RETURNING *;
        """)
        result = db.session.execute(query, {**data, "event_id": event_id}).fetchone()
        db.session.commit()
        return dict(result._mapping) if result else None

    @classmethod
    def update_status(cls, event_id, new_status):
        result = db.session.execute(
            text("""
                UPDATE events
                SET status = :status, updated_at = CURRENT_TIMESTAMP
                WHERE event_id = :event_id
                RETURNING *;
            """),
            {"event_id": event_id, "status": new_status}
        ).fetchone()
        db.session.commit()
        return dict(result._mapping) if result else None

    @classmethod
    def delete(cls, event_id):
        result = db.session.execute(
            text("DELETE FROM events WHERE event_id = :event_id RETURNING *"),
            {"event_id": event_id}
        ).fetchone()
        db.session.commit()
        return dict(result._mapping) if result else None


class EventCenter(db.Model):
    __tablename__ = "event_centers"

    event_id = db.Column(db.Integer, db.ForeignKey("events.event_id", ondelete="CASCADE"), primary_key=True)
    center_id = db.Column(db.Integer, db.ForeignKey("evacuation_centers.center_id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=text("CURRENT_TIMESTAMP"))

    @classmethod
    def get_centers_by_event(cls, event_id):
        try:
            result = db.session.execute(
                text("""
                    SELECT ec.center_id, ec.center_name, ec.address, ec.capacity, ec.current_occupancy
                    FROM event_centers ecj
                    JOIN evacuation_centers ec ON ecj.center_id = ec.center_id
                    WHERE ecj.event_id = :event_id
                """),
                {"event_id": event_id}
            )
            return [dict(row._mapping) for row in result.fetchall()]
        except Exception:
            return []

    @classmethod
    def add_centers(cls, event_id, center_ids):
        for center_id in center_ids:
            db.session.execute(
                text("""
                    INSERT INTO event_centers (event_id, center_id)
                    VALUES (:event_id, :center_id)
                    ON CONFLICT DO NOTHING
                """),
                {"event_id": event_id, "center_id": center_id}
            )
        db.session.commit()

    @classmethod
    def remove_centers(cls, event_id, center_ids=None):
        if center_ids:
            for center_id in center_ids:
                db.session.execute(
                    text("DELETE FROM event_centers WHERE event_id = :event_id AND center_id = :center_id"),
                    {"event_id": event_id, "center_id": center_id}
                )
        else:
            db.session.execute(
                text("DELETE FROM event_centers WHERE event_id = :event_id"),
                {"event_id": event_id}
            )
        db.session.commit()
