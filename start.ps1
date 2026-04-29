Write-Host "Starting AdsPower Portal..." -ForegroundColor Cyan

# Start backend
Write-Host "Starting backend on port 3001..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "$PSScriptRoot\portal\server"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting frontend on port 3000..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "$PSScriptRoot\portal\client\node_modules\.bin\vite.cmd" -WorkingDirectory "$PSScriptRoot\portal\client"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Portal running at http://localhost:3000" -ForegroundColor Green
