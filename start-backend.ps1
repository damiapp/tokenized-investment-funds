# Start Backend Server
# Run this in Terminal 3 (after contracts are deployed)

Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"

Write-Host "Backend will connect to deployed ERC-3643 contracts" -ForegroundColor Cyan
Write-Host ""

# Seed database with demo data
Write-Host "Seeding database with demo data..." -ForegroundColor Yellow
node src/seeders/seed.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "⚠ Seed failed - continuing anyway" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Server will run on http://localhost:3001" -ForegroundColor Yellow
Write-Host ""

npm run dev
