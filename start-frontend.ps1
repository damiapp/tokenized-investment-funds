# Start Frontend Application
# Run this in Terminal 4 (after backend is running)

Write-Host "Starting Frontend Application..." -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\frontend"

Write-Host "Frontend will run on http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""

npm start
