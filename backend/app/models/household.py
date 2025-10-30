from app.models import db

class Household(db.Model):
    id = db.Column(db.Integer, primary_key=True)