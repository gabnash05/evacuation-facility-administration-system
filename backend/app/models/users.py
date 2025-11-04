"""User model for EFAS authentication."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text  # Add this import
from werkzeug.security import generate_password_hash

from app.models import db
from app.schemas.user import UserResponseSchema


class User(db.Model):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.String(20), nullable=False
    )  # super_admin, city_admin, center_admin, volunteer
    center_id = db.Column(
        db.Integer, db.ForeignKey("evacuation_center.center_id"), nullable=True
    )  # Fixed table name
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert user to dictionary for JSON serialization."""
        schema = UserResponseSchema()
        return schema.dump(self)

    def to_schema(self):
        """Convert user to Marshmallow response schema."""
        schema = UserResponseSchema()
        return schema.dump(self)

    def __repr__(self):
        return (
            f"<User(user_id={self.user_id}, email='{self.email}', role='{self.role}')>"
        )

    @classmethod
    def _row_to_user(cls, row) -> Optional["User"]:
        """Convert SQLAlchemy Row to User object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_email(cls, email: str) -> Optional["User"]:
        """Get user by email address using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE email = :email AND is_active = TRUE"),
            {"email": email},
        ).fetchone()

        return cls._row_to_user(result)

    @classmethod
    def get_active_by_email(cls, email: str) -> Optional["User"]:
        """Get active user by email address using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE email = :email AND is_active = TRUE"),
            {"email": email},
        ).fetchone()
        return cls._row_to_user(result)

    @classmethod
    def get_by_id(cls, user_id: int) -> Optional["User"]:
        """Get user by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE user_id = :user_id AND is_active = TRUE"),
            {"user_id": user_id},
        ).fetchone()

        return cls._row_to_user(result)

    @classmethod
    def get_by_role(cls, role: str) -> List["User"]:
        """Get all users with specified role using raw SQL."""
        results = db.session.execute(
            text("SELECT * FROM users WHERE role = :role AND is_active = TRUE"),
            {"role": role},
        ).fetchall()

        return [cls._row_to_user(row) for row in results if cls._row_to_user(row)]

    @classmethod
    def create_from_schema(cls, register_data: Dict[str, Any]) -> "User":
        """Create a new user from registration data using raw SQL."""
        password_hash = generate_password_hash(register_data["password"])

        result = db.session.execute(
            text(
                """  
            INSERT INTO users (email, password_hash, role, center_id, is_active) 
            VALUES (:email, :password_hash, :role, :center_id, TRUE)
            RETURNING user_id, created_at, updated_at
            """
            ),
            {
                "email": register_data["email"],
                "password_hash": password_hash,
                "role": register_data["role"],
                "center_id": register_data.get("center_id"),
            },
        ).fetchone()

        db.session.commit()

        result_dict = result._asdict()

        user = cls(
            user_id=result_dict["user_id"],
            email=register_data["email"],
            password_hash=password_hash,
            role=register_data["role"],
            center_id=register_data.get("center_id"),
            created_at=result_dict["created_at"],
            updated_at=result_dict["updated_at"],
        )
        return user

    @classmethod
    def deactivate_user(cls, user_id: int) -> bool:
        """Deactivate a user account using raw SQL."""
        result = db.session.execute(
            text(
                """  
            UPDATE users 
            SET is_active = FALSE, updated_at = NOW() 
            WHERE user_id = :user_id 
            RETURNING user_id
            """
            ),
            {"user_id": user_id},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def update_user(cls, user_id: int, update_data: Dict[str, Any]) -> Optional["User"]:
        """Update user information using raw SQL."""
        # Build dynamic UPDATE query
        set_clauses = []
        params = {"user_id": user_id}

        for field, value in update_data.items():
            if value is not None and field != "user_id":  # Prevent ID modification
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""  
            UPDATE users 
            SET {', '.join(set_clauses)}
            WHERE user_id = :user_id AND is_active = TRUE
            RETURNING *
        """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        return cls._row_to_user(result)

    @classmethod
    def get_all_active_users(cls) -> List["User"]:
        """Get all active users using raw SQL."""
        results = db.session.execute(
            text("SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC")
        ).fetchall()

        return [cls(**dict(row)) for row in results]

    @classmethod
    def get_users_by_center(cls, center_id: int) -> List["User"]:
        """Get all users associated with a center using raw SQL."""
        results = db.session.execute(
            text(
                "SELECT * FROM users WHERE center_id = :center_id AND is_active = TRUE"
            ),
            {"center_id": center_id},
        ).fetchall()

        return [cls(**dict(row)) for row in results]
