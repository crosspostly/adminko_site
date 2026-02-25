param(
    [string]$SourceFile = "site\public\index-updated.html",
    [string]$TargetFile = "site\public\index.html"
)

# Check if source file exists
if (-not (Test-Path $SourceFile)) {
    Write-Host "❌ Файл $SourceFile не найден!" -ForegroundColor Red
    Write-Host "Сначала скачайте изменения через кнопку '📥 Скачать HTML файл'" -ForegroundColor Yellow
    exit 1
}

# Backup original file
$BackupFile = "site\public\index-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
Copy-Item $TargetFile $BackupFile
Write-Host "✅ Бэкап создан: $BackupFile" -ForegroundColor Green

# Replace file
Copy-Item $SourceFile $TargetFile -Force
Write-Host "✅ Файл index.html обновлён!" -ForegroundColor Green
Write-Host "📁 Обновлённый файл: $TargetFile" -ForegroundColor Cyan
