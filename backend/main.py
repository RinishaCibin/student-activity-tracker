
from contextlib import asynccontextmanager
import sqlite3

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

DATABASE = "activities.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            activity TEXT NOT NULL,
            hours REAL NOT NULL CHECK (hours > 0)
        )
        """
    )
    connection.commit()
    connection.close()
    yield


app = FastAPI(
    title="Student Activity Tracker API",
    lifespan=lifespan,
)




app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://student-activity-tracker-kappa.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ActivityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    activity: str = Field(min_length=1, max_length=250)
    hours: float = Field(gt=0, le=24)


@app.get("/")
def home():
    return {"message": "Student Activity Tracker API is running!"}


@app.post("/activities", status_code=201)
def create_activity(data: ActivityCreate):
    name = data.name.strip()
    activity = data.activity.strip()

    if not name or not activity:
        raise HTTPException(
            status_code=422,
            detail="Name and activity cannot be empty.",
        )

    connection = get_connection()
    try:
        cursor = connection.execute(
            "INSERT INTO activities (name, activity, hours) VALUES (?, ?, ?)",
            (name, activity, data.hours),
        )
        connection.commit()

        return {
            "id": cursor.lastrowid,
            "name": name,
            "activity": activity,
            "hours": data.hours,
            "message": "Activity added successfully",
        }
    finally:
        connection.close()


@app.put("/activities/{activity_id}")
def update_activity(activity_id: int, data: ActivityCreate):
    name = data.name.strip()
    activity = data.activity.strip()

    if not name or not activity:
        raise HTTPException(
            status_code=422,
            detail="Name and activity cannot be empty.",
        )

    connection = get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM activities WHERE id = ?",
            (activity_id,),
        ).fetchone()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Activity not found.",
            )

        connection.execute(
            """
            UPDATE activities
            SET name = ?, activity = ?, hours = ?
            WHERE id = ?
            """,
            (name, activity, data.hours, activity_id),
        )
        connection.commit()

        return {
            "id": activity_id,
            "name": name,
            "activity": activity,
            "hours": data.hours,
            "message": "Activity updated successfully",
        }
    finally:
        connection.close()



@app.get("/activities")
def get_activities():
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT id, name, activity, hours FROM activities ORDER BY id DESC"
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        connection.close()


@app.get("/summary")
def get_summary():
    connection = get_connection()
    try:
        totals = connection.execute(
            """
            SELECT COUNT(*) AS total_entries,
                   COALESCE(SUM(hours), 0) AS total_hours
            FROM activities
            """
        ).fetchone()

        most_active = connection.execute(
            """
            SELECT name, SUM(hours) AS total_hours
            FROM activities
            GROUP BY LOWER(TRIM(name))
            ORDER BY total_hours DESC, LOWER(TRIM(name)) ASC
            LIMIT 1
            """
        ).fetchone()

        return {
            "total_entries": totals["total_entries"],
            "total_hours": totals["total_hours"],
            "most_active_user": (
                most_active["name"] if most_active else None
            ),
        }
    finally:
        connection.close()


@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int):
    connection = get_connection()
    try:
        cursor = connection.execute(
            "DELETE FROM activities WHERE id = ?",
            (activity_id,),
        )
        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Activity not found.",
            )

        return {
            "message": "Activity deleted successfully",
            "id": activity_id,
        }
    finally:
        connection.close()