from app.models import db


class Individual(db.Model):
    id = db.Column(db.Integer, primary_key=True)
