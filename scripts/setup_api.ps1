Set-Location "$PSScriptRoot\..\apps\api"
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -e .[dev]
python -m app.seed
Write-Host "API setup complete."
