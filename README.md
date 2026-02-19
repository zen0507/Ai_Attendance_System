# EduTrack AI - Advanced Academic Monitoring System

## Overview
EduTrack AI is a comprehensive MERN stack application designed to monitor user activity, student attendance, and academic performance. It features role-based access for Admins, Teachers, and Students, along with detailed analytics and AI-driven risk analysis.

## Features

### 1. Architecture & Security
- **JWT Authentication**: Secure stateless authentication with role-based middleware.
- **Security Headers**: Implemented using `helmet` and `cors` for production readiness.
- **Audit Trails**: Detailed `ActivityLog` stored in MongoDB for all critical actions.
- **Service Layer**: Business logic extracted into `services/` for maintainability.

### 2. Admin Dashboard
- **Real-time Activity Feed**: Monitors system usage and user actions.
- **System Health**: Visualizes CPU/Memory usage (mock data) and academic health.
- **User Management**: Rapidly create and manage Users, Subjects, and assignments.

### 3. Teacher Dashboard
- **Attendance Management**: Mark attendance for batches/subjects.
- **Marks Entry**: Upload marks for tests and assignments.
- **Analytics**: View attendance trends and student risk profile.

### 4. Student Dashboard
- **Performance Tracking**: Visual progress bars for attendance and marks.
- **AI Risk Analysis**: Machine Learning model (heuristic) calculates "Risk Probability" based on attendance < 75% and low marks.
- **Comparative Charts**: Compare personal performance against class averages.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, DaisyUI, Chart.js, Framer Motion (for transitions).
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Tools**: Axios, Lucide-React, React-Router-DOM.

## Setup & Installation

Follow these steps to set up the project on a new system.

### Prerequisites (Install these first)
1.  **Node.js** (v18 or higher): [Download Here](https://nodejs.org/)
2.  **MongoDB** (Community Server): [Download Here](https://www.mongodb.com/try/download/community)
    *   Make sure MongoDB is running locally on port `27017` (default).

### Installation Steps

### Installation & Running

#### Option 1: The Easy Way (Windows Only)
1.  **Unzip** the folder.
2.  Double-click `start_app.bat`.
    *   This script will automatically install all dependencies and start both the backend and frontend servers for you.

#### Option 2: Manual Setup
If you prefer to run commands manually or are on Mac/Linux:

**1. Backend Setup**
```bash
cd backend
npm install
# Ensure .env exists (it should be in the zip)
npm start
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

The application should now be accessible at `http://localhost:5173`.

## Project Structure
- `backend/controllers`: Request handlers.
- `backend/services`: Business logic (User, Attendance, Marks).
- `backend/models`: Mongoose schemas.
- `frontend/src/pages`: Main dashboard views.
- `frontend/src/components`: Reusable UI components.
- `frontend/src/context`: React Context for global state (Auth, Toast).

## AI Risk Model
The system uses a weighted algorithm to calculate student risk:
- **Attendance < 75%**: High risk factor.
- **Marks < 40% (Fail)**: High risk factor.
- **Combination**: Calculates a probability score (0-1) and assigns a label (Safe, Moderate, High, Critical).

## License
MIT
