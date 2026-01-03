# Test the auth endpoints with PowerShell

Write-Host "Testing auth endpoints..." -ForegroundColor Green

# Test register endpoint
Write-Host "`n1. Testing POST /auth/register" -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "testpassword123"
        role = "LP"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "User: $($response.data.user.email)" -ForegroundColor Cyan
    Write-Host "Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Cyan
    $token = $response.data.token
} catch {
    Write-Host "❌ Registration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test login endpoint
Write-Host "`n2. Testing POST /auth/login" -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "User: $($response.data.user.email)" -ForegroundColor Cyan
    Write-Host "Token: $($response.data.token.Substring(0, 20))..." -ForegroundColor Cyan
    $token = $response.data.token
} catch {
    Write-Host "❌ Login failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test GET /me endpoint
if ($token) {
    Write-Host "`n3. Testing GET /auth/me" -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Method GET -Headers $headers
        Write-Host "✅ GET /me successful!" -ForegroundColor Green
        Write-Host "User: $($response.data.email)" -ForegroundColor Cyan
        Write-Host "Role: $($response.data.role)" -ForegroundColor Cyan
        Write-Host "KYC Status: $($response.data.kyc.status)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ GET /me failed:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
