param(
    [string]$SourceFile = "index-updated.html",
    [string]$TargetDir = "site\public"
)

# Check if source file exists
if (-not (Test-Path $SourceFile)) {
    Write-Host "❌ Файл $SourceFile не найден!" -ForegroundColor Red
    exit 1
}

$TargetFile = Join-Path $TargetDir "index.html"

# Check if target file exists
if (-not (Test-Path $TargetFile)) {
    Write-Host "❌ Целевой файл $TargetFile не найден!" -ForegroundColor Red
    exit 1
}

# Backup original file
$BackupFile = Join-Path $TargetDir "index-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
Copy-Item $TargetFile $BackupFile
Write-Host "✅ Бэкап создан: $BackupFile" -ForegroundColor Green

# Replace file
Copy-Item $SourceFile $TargetFile -Force
Write-Host "✅ Файл index.html обновлён!" -ForegroundColor Green
Write-Host "📁 Обновлённый файл: $TargetFile" -ForegroundColor Cyan
