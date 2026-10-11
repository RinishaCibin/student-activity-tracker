# Student Activity Tracker — Frontend

A responsive React application for tracking student activities and monitoring their progress.

## Features

- Add student activities
- View all activities
- Edit and update existing activities
- Delete activities
- Dashboard summary showing total entries, total hours, and the most active student
- FastAPI backend integration using Axios

## Technologies Used

- React
- Vite
- Axios
- CSS
- FastAPI (Backend)

## Prerequisites

- Node.js and npm
- Python installed for running the backend

## Run the Frontend

Open a terminal in the `frontend` directory and run:

```powershell
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually:

`http://localhost:5173`

## Backend Connection

The frontend connects to the FastAPI backend at:

`http://127.0.0.1:8000`

Make sure the backend is running before using the application.

## API Endpoints

- `GET /activities` — Retrieve all activities
- `POST /activities` — Create an activity
- `PUT /activities/{activity_id}` — Update an activity
- `DELETE /activities/{activity_id}` — Delete an activity
- `GET /summary` — Retrieve dashboard statistics

## Backend API Documentation

When the backend is running, visit:

`http://127.0.0.1:8000/docs`
