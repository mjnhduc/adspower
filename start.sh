#!/bin/bash

echo "Starting AdsPower Portal..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend
echo "Starting backend on port 3001..."
node "$SCRIPT_DIR/portal/server/index.js" &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "Starting frontend on port 3000..."
"$SCRIPT_DIR/portal/client/node_modules/.bin/vite" --config "$SCRIPT_DIR/portal/client/vite.config.js" &
FRONTEND_PID=$!

echo ""
echo "Portal running at http://localhost:3000"
echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers"

# Stop both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT

wait
