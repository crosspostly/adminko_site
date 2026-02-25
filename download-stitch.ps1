$headers = @{
    "X-Goog-Api-Key" = "AQ.Ab8RN6IyOJfE2_9Nvo_rnhbDN7FA8x9nqhB0V_nHyNTwmX2oMw"
    "Content-Type" = "application/json"
}

$projectId = "17099138477568540232"
$screenId = "677c1fb4080e44fa97170ac12d8c53dc"

# Get screen details
$uri = "https://stitch.googleapis.com/v1/projects/$projectId/screens/$screenId"
Write-Host "Fetching screen details from: $uri"

try {
    $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    
    Write-Host "Screen Title: $($response.displayName)"
    Write-Host "HTML Download URL: $($response.htmlCode.downloadUrl)"
    Write-Host "Screenshot URL: $($response.screenshot.downloadUrl)"
    
    # Download HTML
    if ($response.htmlCode.downloadUrl) {
        Write-Host "`nDownloading HTML..."
        Invoke-WebRequest -Uri $response.htmlCode.downloadUrl -OutFile "queue/service-details.html"
        Write-Host "✓ HTML saved to queue/service-details.html"
    }
    
    # Download Screenshot
    if ($response.screenshot.downloadUrl) {
        Write-Host "`nDownloading Screenshot..."
        Invoke-WebRequest -Uri $response.screenshot.downloadUrl -OutFile "queue/service-details.png"
        Write-Host "✓ Screenshot saved to queue/service-details.png"
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)"
}
