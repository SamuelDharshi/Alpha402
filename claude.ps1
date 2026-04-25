# Universal Zero-Complexity Claude Launcher
# NOTE: The CLI automatically appends /v1 — do NOT include it in the base URL
$env:ANTHROPIC_BASE_URL = "https://claude-proxy-1zpk.onrender.com"
$env:ANTHROPIC_API_KEY = "sk-ant-dummy"

Write-Host "Launching Claude with Proxy Override..." -ForegroundColor Cyan

# Launch with absolute path to settings
claude --model haiku