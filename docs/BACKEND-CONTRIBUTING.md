# Backend Development Guide

This guide explains how to develop new features for the Flask backend following our architecture, conventions, and layered design.

## Architecture Overview

**Data Flow:**

```
Frontend → Routes → Service → Model → Database
Response ← Routes ← Service (with Schema) ← Model
```

**Directory Responsibilities:**

* `app/models/` — Model files that contain raw SQL queries for database access.
* `app/schemas/` — Schema files that handle input/output validation.
* `app/services/` — Service files that contain **business logic** (rules, constraints, multi-step operations).
* `app/routes/` — Route files that define HTTP endpoints and handle requests/responses.
* `app/utils/` — Shared helpers or validators used across services.

## Development Workflow

### 1. Create the Model File

The **model file** contains SQLAlchemy table definitions and raw SQL query methods.

```python
# app/models/item.py
from sqlalchemy import text
from app.models import db

class Item(db.Model):
    __tablename__ = "items"

    item_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())

    @classmethod
    def get_by_id(cls, item_id):
        result = db.session.execute(text("SELECT * FROM items WHERE item_id = :id"), {"id": item_id}).fetchone()
        return cls(**dict(result)) if result else None

    @classmethod
    def create(cls, name: str, price: float):
        result = db.session.execute(
            text("INSERT INTO items (name, price) VALUES (:name, :price) RETURNING *"),
            {"name": name, "price": price}
        ).fetchone()
        db.session.commit()
        return cls(**dict(result))
```

### 2. Update Schema Files

Schema files define how data is validated and serialized. These are based on the model fields.

```python
# app/schemas/item.py
from marshmallow import Schema, fields, validate

class ItemCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    price = fields.Float(required=True, validate=validate.Range(min=0))

class ItemResponseSchema(Schema):
    item_id = fields.Integer(dump_only=True)
    name = fields.String(dump_only=True)
    price = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
```

### 3. Create the Service File

Service files contain **business logic** — the rules and operations that go beyond basic CRUD. These include:

* Validating business rules before writing to the database
* Combining multiple model operations into one transaction
* Handling permission or role-based checks

```python
# app/services/item_service.py
import logging
from app.models.item import Item

logger = logging.getLogger(__name__)

class ItemService:
    @staticmethod
    def create_item(data):
        name = data["name"]
        price = data["price"]

        # Example of business logic:
        # Prevent creating items with the same name.
        existing = db.session.execute(
            text("SELECT 1 FROM items WHERE name = :name"), {"name": name}
        ).fetchone()
        if existing:
            return {"success": False, "message": "Item name already exists"}

        item = Item.create(name, price)
        return {"success": True, "item": item}

    @staticmethod
    def get_item(item_id):
        item = Item.get_by_id(item_id)
        if not item:
            return {"success": False, "message": "Item not found"}
        return {"success": True, "item": item}
```

### 4. Define the Routes

Route files connect Flask endpoints to service functions. They handle HTTP methods, request parsing, and response formatting.

```python
# app/routes/item_routes.py
from flask import Blueprint, jsonify, request
from app.services.item_service import ItemService
from app.schemas.item import ItemCreateSchema, ItemResponseSchema

bp = Blueprint("item_bp", __name__)
create_schema = ItemCreateSchema()
response_schema = ItemResponseSchema()

@bp.route("/items", methods=["POST"])
def create_item():
    data = request.get_json()
    try:
        valid_data = create_schema.load(data)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

    result = ItemService.create_item(valid_data)

    if not result["success"]:
        return jsonify(result), 400

    return jsonify({"success": True, "data": response_schema.dump(result["item"])}), 201

@bp.route("/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    result = ItemService.get_item(item_id)
    if not result["success"]:
        return jsonify(result), 404
    return jsonify({"success": True, "data": response_schema.dump(result["item"])}), 200
```

Register the blueprint in `app/__init__.py`:

```python
from app.routes.item_routes import bp as item_bp
app.register_blueprint(item_bp, url_prefix="/api")
```

### 5. Test Your Feature

Run the backend:

```bash
pipenv run python run.py
```

Test endpoints with:

```bash
curl -X POST http://localhost:5000/api/items -H "Content-Type: application/json" -d '{"name": "Chair", "price": 29.99}'
```

or with **Postman** *(refer to Postman tutorial)*

## Summary of Responsibilities

| Layer       | Purpose                                                   | Example                              |
| ----------- | --------------------------------------------------------- | ------------------------------------ |
| **Model**   | Handles raw SQL queries and DB mapping                    | `User.get_by_email()`                |
| **Schema**  | Validates input/output                                    | `UserRegisterSchema`                 |
| **Service** | Implements business rules, data orchestration             | `register_user()` checks permissions |
| **Route**   | Defines API endpoints, parses requests, formats responses | `/auth/register` route               |

## Best Practices

1. **Keep routes clean:** Never include SQL or complex logic in route files.
2. **Always validate input:** All incoming data should pass through a schema.
3. **Isolate business logic:** Services should handle conditions like duplicate entries or permission restrictions.
4. **Use logging:** Log significant events for easier debugging.
5. **Use raw SQL carefully:** Parameterize all queries to prevent SQL injection.

---