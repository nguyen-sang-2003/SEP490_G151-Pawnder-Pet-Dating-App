# Script cập nhật Connection String để dùng Session Pooler (tránh IPv6)
# Session Pooler sử dụng port 6543 và hỗ trợ IPv4

$appName = 'pawnder-backend-2024'
$resourceGroup = Read-Host "Nhập Resource Group name (hoặc Enter để tự động tìm)"

# Connection string với Session Pooler (port 6543, username có project ID)
$connectionString = "Host=db.ahidmtzxupsbcsuofera.supabase.co;Port=6543;Database=postgres;Username=postgres.ahidmtzxupsbcsuofera;Password=TqoE22hVMHok8kCr;SSL Mode=Require;Trust Server Certificate=true"

Write-Host ""
Write-Host "=== Cập nhật Connection String - Dùng Session Pooler (IPv4) ===" -ForegroundColor Cyan
Write-Host "App Name: $appName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Lý do: Supabase đang trả về IPv6, Azure App Service không hỗ trợ IPv6" -ForegroundColor Yellow
Write-Host "Giải pháp: Dùng Session Pooler (port 6543) - hỗ trợ IPv4" -ForegroundColor Green
Write-Host ""

# Kiểm tra Azure login
Write-Host "Kiểm tra Azure login..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if ($account) {
        Write-Host "✓ Đã login Azure: $($account.name)" -ForegroundColor Green
    } else {
        throw "Chưa login"
    }
} catch {
    Write-Host "Chưa login Azure. Đang login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Lỗi khi login Azure" -ForegroundColor Red
        exit 1
    }
}

# Tìm resource group
if ([string]::IsNullOrWhiteSpace($resourceGroup)) {
    Write-Host "Đang tìm resource group..." -ForegroundColor Yellow
    $rgList = az group list --query "[?contains(name, 'pawnder') || contains(name, 'backend') || contains(name, 'rg-')].{Name:name}" -o json | ConvertFrom-Json
    if ($rgList -and $rgList.Count -gt 0) {
        if ($rgList.Count -eq 1) {
            $resourceGroup = $rgList[0].Name
            Write-Host "✓ Tìm thấy resource group: $resourceGroup" -ForegroundColor Green
        } else {
            Write-Host "Tìm thấy các resource group:" -ForegroundColor Yellow
            for ($i = 0; $i -lt $rgList.Count; $i++) {
                Write-Host "  [$i] $($rgList[$i].Name)" -ForegroundColor Gray
            }
            $selected = Read-Host "Chọn số (0-$($rgList.Count-1)) hoặc Enter để chọn đầu tiên"
            if ([string]::IsNullOrWhiteSpace($selected)) {
                $resourceGroup = $rgList[0].Name
            } else {
                $resourceGroup = $rgList[[int]$selected].Name
            }
            Write-Host "✓ Chọn resource group: $resourceGroup" -ForegroundColor Green
        }
    } else {
        Write-Host "Không tìm thấy resource group. Vui lòng nhập thủ công:" -ForegroundColor Yellow
        $resourceGroup = Read-Host "Resource Group name"
    }
}

if ([string]::IsNullOrWhiteSpace($resourceGroup)) {
    Write-Host "✗ Resource group không được để trống" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Thông tin Connection String mới ===" -ForegroundColor Cyan
Write-Host "Host: db.ahidmtzxupsbcsuofera.supabase.co" -ForegroundColor Gray
Write-Host "Port: 6543 (Session Pooler - IPv4 compatible)" -ForegroundColor Green
Write-Host "Database: postgres" -ForegroundColor Gray
Write-Host "Username: postgres.ahidmtzxupsbcsuofera (có project ID)" -ForegroundColor Green
Write-Host "Password: TqoE22hVMHok8kCr" -ForegroundColor Gray
Write-Host ""

Write-Host "Đang cập nhật connection string..." -ForegroundColor Yellow

# Cập nhật connection string
az webapp config connection-string set `
    --name $appName `
    --resource-group $resourceGroup `
    --connection-string-type PostgreSQL `
    --settings DbContext="$connectionString" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Connection string đã được cập nhật!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Đang restart app..." -ForegroundColor Yellow
    az webapp restart --name $appName --resource-group $resourceGroup --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ App đã được restart!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Đợi 15 giây để app khởi động lại..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        Write-Host ""
        Write-Host "=== Hoàn tất ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Kiểm tra app tại:" -ForegroundColor Yellow
        Write-Host "https://$appName-bwajcqa2axg9fjcf.eastasia-01.azurewebsites.net/swagger/index.html" -ForegroundColor Green
        Write-Host ""
        Write-Host "Xem logs để kiểm tra:" -ForegroundColor Yellow
        Write-Host "az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Lưu ý:" -ForegroundColor Yellow
        Write-Host "- Session Pooler hỗ trợ IPv4, không cần whitelist IP" -ForegroundColor Gray
        Write-Host "- Port 6543 thay vì 5432" -ForegroundColor Gray
        Write-Host "- Username phải có project ID: postgres.ahidmtzxupsbcsuofera" -ForegroundColor Gray
    } else {
        Write-Host "✗ Lỗi khi restart app" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Lỗi khi cập nhật connection string" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui lòng cập nhật thủ công qua Azure Portal:" -ForegroundColor Yellow
    Write-Host "1. Vào App Services -> $appName -> Configuration" -ForegroundColor Gray
    Write-Host "2. Connection strings -> DbContext" -ForegroundColor Gray
    Write-Host "3. Value: $connectionString" -ForegroundColor Gray
    Write-Host "4. Type: PostgreSQL" -ForegroundColor Gray
    Write-Host "5. Apply -> Restart" -ForegroundColor Gray
}

