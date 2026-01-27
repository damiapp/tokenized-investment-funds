# Start Hardhat Node for ERC-3643 Development
# Run this in Terminal 1

Write-Host "Starting Hardhat Node..." -ForegroundColor Green
Write-Host "Keep this terminal running" -ForegroundColor Yellow
Write-Host ""

Set-Location -Path "$PSScriptRoot\contracts"
npx hardhat node
