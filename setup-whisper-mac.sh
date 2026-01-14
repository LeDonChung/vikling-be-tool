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

# Download pre-compiled binary for macOS
echo ""
echo "Downloading whisper.cpp macOS binary..."

WHISPER_DIR="whisper-bin"
BINARY_URL="https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.5/whisper-bin-macos.zip"
ZIP_FILE="whisper-bin.zip"

if curl -L -o "$ZIP_FILE" "$BINARY_URL"; then
    echo "Download complete!"
else
    echo "Failed to download from v1.5.5, trying alternative..."
    BINARY_URL="https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-macos.zip"
    if curl -L -o "$ZIP_FILE" "$BINARY_URL"; then
        echo "Download complete!"
    else
        echo "Failed to download pre-built binary."
        echo "Trying to build from source..."
        
        # Clone and build whisper.cpp
        if command -v git &> /dev/null && command -v make &> /dev/null; then
            if [ ! -d "whisper.cpp" ]; then
                git clone https://github.com/ggerganov/whisper.cpp.git
            fi
            cd whisper.cpp
            make
            cd ..
            
            # Create whisper-bin directory and copy binary
            mkdir -p "$WHISPER_DIR"
            cp whisper.cpp/main "$WHISPER_DIR/"
            
            echo "Built whisper.cpp from source successfully!"
            echo ""
            echo "=== Setup Complete ==="
            echo "Binary location: $WHISPER_DIR/main"
            echo "Models directory: $MODELS_DIR"
            echo ""
            echo "You can now start the server with: pnpm start:dev"
            exit 0
        else
            echo "Please install Xcode Command Line Tools:"
            echo "xcode-select --install"
            exit 1
        fi
    fi
fi

# Extract binary
echo ""
echo "Extracting binary..."
if [ -d "$WHISPER_DIR" ]; then
    rm -rf "$WHISPER_DIR"
fi

if unzip -q "$ZIP_FILE" -d "$WHISPER_DIR"; then
    echo "Extraction complete!"
else
    echo "Failed to extract binary"
    exit 1
fi

# Cleanup zip
rm -f "$ZIP_FILE"

# Make binaries executable
chmod +x "$WHISPER_DIR"/*

# Find main binary
if [ -f "$WHISPER_DIR/main" ]; then
    echo ""
    echo "=== Setup Complete ==="
    echo "Found binary: $WHISPER_DIR/main"
    echo "Models directory: $MODELS_DIR"
    echo ""
    echo "You can now start the server with: pnpm start:dev"
else
    BINARIES=$(find "$WHISPER_DIR" -type f -perm +111 2>/dev/null)
    if [ -n "$BINARIES" ]; then
        echo ""
        echo "=== Setup Complete ==="
        echo "Found executables:"
        echo "$BINARIES"
        echo ""
        echo "Models directory: $MODELS_DIR"
        echo ""
        echo "You can now start the server with: pnpm start:dev"
    else
        echo ""
        echo "Warning: No executable files found in extracted archive"
        echo "Please check the contents of: $WHISPER_DIR"
    fi
fi
