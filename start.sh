#!/bin/bash

# M.A.S. AI Start Script

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down M.A.S. AI..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "🛡️  Starting M.A.S. AI..."
echo "======================="

# Check if ports are already in use
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 (Backend) is already in use. Killing process..."
    lsof -t -i :3001 | xargs kill -9
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 (Frontend) is already in use. Killing process..."
    lsof -t -i :3000 | xargs kill -9
fi

# Start Backend
echo "🚀 Starting Backend (Port 3001)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready (simple sleep for now, or check generic port)
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start Frontend
echo "🚀 Starting Frontend (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "======================="
echo "✅ M.A.S. AI is running!"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait for all background processes
wait
