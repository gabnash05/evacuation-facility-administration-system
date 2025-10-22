"""Initialize database models and extensions."""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

from app.models.user import User
# from app.models.event import Event
# from app.models.center import EvacuationCenter
# from app.models.household import Household
# from app.models.individual import Individual