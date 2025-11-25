# View Azure App Service Logs
$appName = 'pawnder-backend-2024'

Write-Host 'Fetching recent logs...' -ForegroundColor Yellow

# Get the URL to download logs
Invoke-WebRequest -Uri "https://$appName.scm.azurewebsites.net/api/logs/docker" -OutFile "app-logs.txt" 2>$null

if (Test-Path "app-logs.txt") {
    Get-Content "app-logs.txt" -Tail 50
} else {
    Write-Host 'Cannot fetch logs. Trying alternative method...' -ForegroundColor Red
    Write-Host 'Please check logs manually at:' -ForegroundColor Cyan
    Write-Host "https://$appName.scm.azurewebsites.net/api/logs/docker" -ForegroundColor Green
}
