# Android Environment Reset Script (PowerShell - Registry Restoration Version)
Write-Host "🔄 Resetting Android environment..." -ForegroundColor Cyan

# NEW: Restore standard ADB port by deleting the Registry override
Write-Host "🧹 Restoring standard ADB port configuration..."
try {
    # Check both User and System environment (though it's usually in User)
    if (Get-ItemProperty -Path "HKCU:\Environment" -Name "ANDROID_ADB_SERVER_PORT" -ErrorAction SilentlyContinue) {
        Remove-ItemProperty -Path "HKCU:\Environment" -Name "ANDROID_ADB_SERVER_PORT" -Force
        Write-Host "  ✅ Deleted ANDROID_ADB_SERVER_PORT from User Registry."
    }
    # Unset for the current session to be absolutely sure
    $env:ANDROID_ADB_SERVER_PORT = "5037"
    $env:ADB_SERVER_PORT = "5037"
} catch {
    Write-Host "  ⚠️ Could not modify registry (might require elevated shell)."
}

$CurrentPid = $PID
$ProcNames = @("adb", "java", "node")

foreach ($Name in $ProcNames) {
    Write-Host "🕵️ Checking for $Name..."
    $Processes = Get-Process -Name $Name -ErrorAction SilentlyContinue
    
    foreach ($P in $Processes) {
        if ($P.Id -eq $CurrentPid) { continue }
        
        # Surgical Node kill: only Metro/Expo
        if ($Name -eq "node") {
            try {
                $CommandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($P.Id)").CommandLine
                if ($CommandLine -like "*expo*" -or $CommandLine -like "*metro*" -or $CommandLine -like "*react-native*") {
                    Write-Host "  ✅ Terminating $Name (PID $($P.Id))"
                    Stop-Process -Id $P.Id -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        } else {
            Write-Host "  ✅ Terminating $Name (PID $($P.Id))"
            Stop-Process -Id $P.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# NEW: Aggressive port-based cleanup
$Ports = @(5037, 5038)
foreach ($Port in $Ports) {
    $PortProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($PortProcess) {
        foreach ($Conn in $PortProcess) {
            Write-Host "🕵️ Found process $($Conn.OwningProcess) squatting on Port $Port. Terminating..."
            Stop-Process -Id $Conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅ Port $Port cleared."
        }
    }
}

Write-Host "⏳ Waiting for ports to clear..."
Start-Sleep -Seconds 3

Write-Host "🧹 Clearing Gradle daemon registry..."
$GradleDaemonPath = "$HOME\.gradle\daemon"
if (Test-Path $GradleDaemonPath) {
    Get-ChildItem -Path $GradleDaemonPath -Include "registry.bin.lock", "registry.bin" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Stale registry files cleared."
}

Write-Host "✨ Environment ready. Letting build tool initialize ADB..."
exit 0
