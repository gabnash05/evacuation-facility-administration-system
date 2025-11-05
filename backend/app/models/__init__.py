"""Initialize database models and extensions."""

from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

from app.models.user import User
from app.models.event import Event
from app.models.evacuation_center import EvacuationCenter
from app.models.household import Household
from app.models.individual import Individual
