Write-Host "Building frontend..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location -Path "../frontend"

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Build the project
Write-Host "Building React application..." -ForegroundColor Cyan
npm run build

# Check if build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Please check the errors above." -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

# Verify build output exists
$staticDir = "../backend/app/static"
if (Test-Path $staticDir) {
    $indexFile = Join-Path $staticDir "index.html"
    if (Test-Path $indexFile) {
        Write-Host "Build successful! Static files are in $staticDir" -ForegroundColor Green
    } else {
        Write-Host "Warning: index.html not found in build output" -ForegroundColor Yellow
    }
} else {
    Write-Host "Error: Build output directory not found at $staticDir" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

# Navigate back to root
Set-Location -Path ".."

Write-Host "`nFrontend build complete! The application is ready to be served from the backend." -ForegroundColor Green
Write-Host "To start the application, run 'pipenv run dev' in the backend directory." -ForegroundColor Yellow
Write-Host "The app will be available at http://localhost:5000" -ForegroundColor Yellow