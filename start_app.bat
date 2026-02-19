@echo off
title EduTrack AI Launcher
echo ===================================================
echo        EduTrack AI - Automatic Launcher
echo ===================================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b
)

echo [2/4] Starting Backend Server...
:: Start backend in a new minimized window
start "EduTrack Backend" /min npm start

cd ..

echo [3/4] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b
)

echo [4/4] Starting Frontend Server...
echo.
echo Application is starting! Check the new window for Backend logs.
echo Frontend will launch in your browser shortly...
echo.
npm run dev
pause
