@echo off
echo ====================================================
echo Starting Thupparivalan Backend Server (FastAPI)
echo ====================================================
cd /d "%~dp0\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
