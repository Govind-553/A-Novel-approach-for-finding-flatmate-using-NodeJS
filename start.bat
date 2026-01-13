@echo off
echo Installing dependencies and starting servers...
pip install -r requirements.txt
cd backend && call npm install && cd ..
start "Clustering Service" cmd /k "venv\Scripts\activate && python -m uvicorn ml_modules.app:app --host 0.0.0.0 --port 8000 --reload"
start "Main Backend" cmd /k "cd backend && npm start"
echo application started! Visit http://localhost:3000
