@echo off
echo ========================================
echo  Attendance Monitoring System - Startup
echo ========================================
echo.

if not exist "%~dp0backend\venv\Scripts\python.exe" (
    echo Backend virtual environment not found.
    echo Run: py -3.12 -m venv backend\venv
    echo Then: backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo Killing any process already on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Starting Python Backend on port 8001...
start "Backend - Attendance System" /D "%~dp0backend" cmd /k "venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

timeout /t 4 /nobreak > nul

echo Starting React Frontend...
start "Frontend - Attendance System" /D "%~dp0frontend" cmd /k "node node_modules/vite/bin/vite.js --port 5173"

echo.
echo ========================================
echo  Backend:  http://localhost:8001
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8001/docs
echo  Login:    admin / admin123
echo ========================================
echo.
echo Both servers are running in their own windows.
echo Close those windows to stop the servers.
pause
