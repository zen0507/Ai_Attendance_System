# EduTrack AI - Setup & Installation Guide

This guide explains how to set up the EduTrack AI project from scratch on a new machine.

## 1. Prerequisites
Before installing, ensure you have the following installed:
*   **Node.js (v18+)**: [Download here](https://nodejs.org/)
*   **MongoDB (Local)**: [Download here](https://www.mongodb.com/try/download/community)
    *   Ensure MongoDB is running on `mongodb://127.0.0.1:27017`.

## 2. Installation (The Easy Way)
I have configured the project to install everything with a single command:

1.  Open your terminal in the **root folder** (the folder containing this guide).
2.  Run the following command:
    ```bash
    npm install
    ```
    *This will automatically install dependencies for both the `frontend` and `backend` folders.*

## 3. Environment Configuration (.env)
Security files like `.env` are not shared automatically. You must set this up manually:

1.  Look for a file named `.env.example` in the root folder.
2.  Copy this file into the `backend/` folder.
3.  Rename it from `.env.example` to **`.env`**.
4.  (Optional) Update the `JWT_SECRET` if you want a custom security key.

## 4. Running the Application

### Option A: Windows (Recommended)
Double-click the **`start_app.bat`** file in the root folder. This will start both the backend and frontend at once.

### Option B: Terminal
Run this command in the root folder:
```bash
npm run dev
```

## 5. Default Port Details
*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:5000`
