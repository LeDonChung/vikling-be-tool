#!/bin/bash

echo "Setting up Whisper.cpp for macOS..."

# Create whisper-models directory
MODELS_DIR="whisper-models"
if [ ! -d "$MODELS_DIR" ]; then
    mkdir -p "$MODELS_DIR"
    echo "Created directory: $MODELS_DIR"
fi

# Check if model already exists
MODEL_FILE="$MODELS_DIR/ggml-small.bin"
if [ -f "$MODEL_FILE" ]; then
    echo "Model 'small' already exists at: $MODEL_FILE"
else
    echo "Model not found. Downloading small model..."
    
    # Download model directly from Hugging Face
    MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    
    echo "Downloading from: $MODEL_URL"
    echo "This may take a few minutes (file size: ~466 MB)..."
    
    if curl -L -o "$MODEL_FILE" "$MODEL_URL"; then
        echo "Model downloaded successfully!"
    else
        echo "Failed to download model from Hugging Face."
        echo "Please download manually from:"
        echo "https://huggingface.co/ggerganov/whisper.cpp/tree/main"
        echo "Save as: $MODEL_FILE"
        exit 1
    fi
fi

# Build from source for macOS
echo ""
echo "Building whisper.cpp from source..."

WHISPER_DIR="whisper-bin"

# Check for required tools
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed"
    echo "Please install Xcode Command Line Tools:"
    echo "xcode-select --install"
    exit 1
fi

if ! command -v cmake &> /dev/null; then
    echo "Error: cmake is not installed"
    echo "Please install cmake:"
    echo "brew install cmake"
    exit 1
fi

# Clone whisper.cpp if not exists
if [ ! -d "whisper.cpp" ]; then
    echo "Cloning whisper.cpp repository..."
    git clone https://github.com/ggerganov/whisper.cpp.git
fi

# Build whisper.cpp
cd whisper.cpp
echo "Building with cmake..."
cmake -B build
cmake --build build -j
cd ..

# Create whisper-bin directory and copy binary
mkdir -p "$WHISPER_DIR"

# Copy the whisper-cli binary (the main executable for macOS)
if [ -f "whisper.cpp/build/bin/whisper-cli" ]; then
    cp whisper.cpp/build/bin/whisper-cli "$WHISPER_DIR/"
    echo "Built whisper.cpp from source successfully!"
    echo ""
    echo "=== Setup Complete ==="
    echo "Binary location: $WHISPER_DIR/whisper-cli"
    echo "Models directory: $MODELS_DIR"
    echo ""
    echo "You can now start the server with: pnpm start:dev"
else
    echo "Error: Failed to build whisper-cli binary"
    echo "Build output should be at: whisper.cpp/build/bin/whisper-cli"
    exit 1
fi
