# Start Backend Server
# Run this in Terminal 3 (after contracts are deployed)

Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"

Write-Host "Backend will connect to deployed ERC-3643 contracts" -ForegroundColor Cyan
Write-Host "Server will run on http://localhost:3001" -ForegroundColor Yellow
Write-Host ""

npm run dev
