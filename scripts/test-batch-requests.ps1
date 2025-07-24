$baseUrl = "http://localhost:3000"
$location = "Istanbul"

Write-Host "=== 5 Requests Test (Random delay) ===" -ForegroundColor Green
Write-Host "Testing: ${baseUrl}/weather?q=${location}" -ForegroundColor Yellow
Write-Host ""

$jobs = @()
$globalStart = Get-Date

$randomDelay = Get-Random -Minimum 700 -Maximum 1300

for ($i = 1; $i -le 20; $i++) {
    $job = Start-Job -ScriptBlock {
        param($url, $location, $requestId)
        $start = Get-Date
        try {
            $response = Invoke-RestMethod -Uri "$url/weather?q=$location" -Method GET
            $end = Get-Date
            $duration = ($end - $start).TotalSeconds
            return @{
                RequestId = $requestId
                Response  = $response
                Duration  = [math]::Round($duration, 2)
                StartTime = $start.ToString("HH:mm:ss.fff")
                EndTime   = $end.ToString("HH:mm:ss.fff")
                Success   = $true
            }
        }
        catch {
            $end = Get-Date
            $duration = ($end - $start).TotalSeconds
            return @{
                RequestId = $requestId
                Error     = $_.Exception.Message
                Duration  = [math]::Round($duration, 2)
                StartTime = $start.ToString("HH:mm:ss.fff")
                EndTime   = $end.ToString("HH:mm:ss.fff")
                Success   = $false
            }
        }
    } -ArgumentList $baseUrl, $location, $i
    $jobs += $job
    
    if ($i -lt 5) {
        Start-Sleep -Milliseconds $randomDelay
    }
}

$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$globalEnd = Get-Date
$totalDuration = ($globalEnd - $globalStart).TotalSeconds

foreach ($result in $results) {
    if ($result.Success) {
        Write-Host "Request $($result.RequestId): $($result.Duration)s [$($result.StartTime) -> $($result.EndTime)]" -ForegroundColor Green
        Write-Host "  Response: $($result.Response | ConvertTo-Json -Compress)" -ForegroundColor White
    }
    else {
        Write-Host "Request $($result.RequestId): ERROR - $($result.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Total test time: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor Cyan
Write-Host "Expected: Requests should join existing batches and finish together" -ForegroundColor Yellow 