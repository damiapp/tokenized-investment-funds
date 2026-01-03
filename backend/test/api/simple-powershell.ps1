# PowerShell curl commands for testing

# Test register endpoint
$body = @{
    email = "test@example.com"
    password = "testpassword123"
    role = "LP"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $body -ContentType "application/json"

# Test login endpoint
$loginBody = @{
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
