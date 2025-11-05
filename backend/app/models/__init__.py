"""Initialize database models and extensions."""

from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

from app.models.users import User
from app.models.events import Event
from app.models.evacuation_centers import EvacuationCenter
from app.models.households import Household
from app.models.individuals import Individual
