# Update Connection String và Restart Azure App Service
# Sử dụng Supabase connection string mới

$appName = 'pawnder-backend-2024'
$resourceGroup = '<your-resource-group>'  # Thay bằng resource group của bạn

# Connection string mới với Supabase
$connectionString = "Host=db.ahidmtzxupsbcsuofera.supabase.co;Database=postgres;Username=postgres;Password=TqoE22hVMHok8kCr;SSL Mode=Require;Trust Server Certificate=true"

Write-Host "=== Cập nhật Connection String cho Azure App Service ===" -ForegroundColor Cyan
Write-Host "App Name: $appName" -ForegroundColor Yellow
Write-Host ""

# Kiểm tra đã login Azure chưa
Write-Host "Kiểm tra Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Chưa login Azure. Đang login..." -ForegroundColor Yellow
    az login
}

# Cập nhật connection string
Write-Host "Đang cập nhật connection string..." -ForegroundColor Yellow
az webapp config connection-string set `
    --name $appName `
    --resource-group $resourceGroup `
    --connection-string-type PostgreSQL `
    --settings DbContext="$connectionString"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection string đã được cập nhật!" -ForegroundColor Green
    
    # Restart app
    Write-Host ""
    Write-Host "Đang restart app..." -ForegroundColor Yellow
    az webapp restart --name $appName --resource-group $resourceGroup
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ App đã được restart!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Kiểm tra app tại:" -ForegroundColor Cyan
        Write-Host "https://$appName-bwajcqa2axg9fjcf.eastasia-01.azurewebsites.net/swagger/index.html" -ForegroundColor Green
    } else {
        Write-Host "✗ Lỗi khi restart app" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Lỗi khi cập nhật connection string" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra:" -ForegroundColor Yellow
    Write-Host "1. Resource group name: $resourceGroup" -ForegroundColor Yellow
    Write-Host "2. App name: $appName" -ForegroundColor Yellow
    Write-Host "3. Đã login Azure: az login" -ForegroundColor Yellow
}

