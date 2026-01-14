# Setup Whisper.cpp Binary for Windows
Write-Host "Setting up Whisper.cpp for Windows..." -ForegroundColor Green

# Create whisper-models directory
$modelsDir = "whisper-models"
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    Write-Host "Created directory: $modelsDir" -ForegroundColor Yellow
}

# Check if model already exists
$modelFile = Join-Path $modelsDir "ggml-small.bin"
if (Test-Path $modelFile) {
    Write-Host "`nModel 'small' already exists at: $modelFile" -ForegroundColor Green
} else {
    Write-Host "`nModel not found. Downloading small model..." -ForegroundColor Yellow
    
    # Download model directly from Hugging Face
    $modelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    
    try {
        Write-Host "Downloading from: $modelUrl" -ForegroundColor Cyan
        Write-Host "This may take a few minutes (file size: ~466 MB)..." -ForegroundColor Yellow
        
        # Download with progress
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $modelUrl -OutFile $modelFile -ErrorAction Stop
        $ProgressPreference = 'Continue'
        
        Write-Host "Model downloaded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download model from Hugging Face." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Host "`nPlease download manually from:" -ForegroundColor Yellow
        Write-Host "https://huggingface.co/ggerganov/whisper.cpp/tree/main" -ForegroundColor Cyan
        Write-Host "Save as: $modelFile" -ForegroundColor Yellow
        exit 1
    }
}

# Download pre-compiled binary
Write-Host "`nDownloading whisper.cpp Windows binary..." -ForegroundColor Cyan

$releaseUrl = "https://github.com/ggerganov/whisper.cpp/releases/latest"
$binaryUrl = "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.5/whisper-bin-x64.zip"
$zipFile = "whisper-bin.zip"
$whisperDir = "whisper-bin"

try {
    Invoke-WebRequest -Uri $binaryUrl -OutFile $zipFile -ErrorAction Stop
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Failed to download from v1.5.5, trying alternative..." -ForegroundColor Yellow
    try {
        $binaryUrl = "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"
        Invoke-WebRequest -Uri $binaryUrl -OutFile $zipFile -ErrorAction Stop
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download binary. Please download manually from:" -ForegroundColor Red
        Write-Host "https://github.com/ggerganov/whisper.cpp/releases" -ForegroundColor Yellow
        exit 1
    }
}

# Extract
Write-Host "`nExtracting binary..." -ForegroundColor Cyan
if (Test-Path $whisperDir) {
    Remove-Item -Recurse -Force $whisperDir
}

try {
    Expand-Archive -Path $zipFile -DestinationPath $whisperDir -Force
    Write-Host "Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "Failed to extract: $_" -ForegroundColor Red
    exit 1
}

# Cleanup zip
Remove-Item $zipFile -Force -ErrorAction SilentlyContinue

# Find main.exe or whisper.exe
$exeFiles = Get-ChildItem -Path $whisperDir -Filter "*.exe" -Recurse
if ($exeFiles.Count -gt 0) {
    Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
    Write-Host "Found executables:" -ForegroundColor Cyan
    foreach ($exe in $exeFiles) {
        Write-Host "  - $($exe.FullName)" -ForegroundColor Yellow
    }
    
    Write-Host "`nModels directory: $modelsDir" -ForegroundColor Cyan
    Write-Host "`nYou can now start the server with: pnpm start:dev" -ForegroundColor Green
} else {
    Write-Host "`nWarning: No .exe files found in extracted archive" -ForegroundColor Yellow
    Write-Host "Please check the contents of: $whisperDir" -ForegroundColor Yellow
}
