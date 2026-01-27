# Deploy ERC-3643 Contracts
# Run this in Terminal 2 (after Hardhat node is running)

Write-Host "Deploying ERC-3643 Contracts..." -ForegroundColor Green
Write-Host ""

Set-Location -Path "$PSScriptRoot\contracts"

Write-Host "Checking if Hardhat node is running..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

npx hardhat run scripts/deploy.js --network localhost

Write-Host ""
Write-Host "Deployment complete! Check output above for contract addresses." -ForegroundColor Green
Write-Host "Contract info saved to: shared/contracts/deployed.json" -ForegroundColor Cyan
