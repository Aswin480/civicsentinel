@echo off
echo Starting Backend...
start cmd /k "cd server && pnpm run dev"

echo Starting Frontend...
start cmd /k "pnpm run dev"

echo Both servers are starting in separate windows.
