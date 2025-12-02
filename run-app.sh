#!/bin/bash

# Image name and input file (must match the packaging script)
IMAGE_NAME="mf24-app"
INPUT_FILE="mf24-app.tar"
DATA_DIR="./data-records"
PLATFORM_FLAG=""

# Check for platform argument
if [[ "$1" == "--platform" && -n "$2" ]]; then
    PLATFORM_FLAG="--platform $2"
    echo "Running with platform: $2"
fi

# Check if the image file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File '$INPUT_FILE' not found!"
    exit 1
fi

echo "Loading Docker image from $INPUT_FILE..."
docker load -i $INPUT_FILE

# Auto-detect platform for Mac ARM users running AMD64 images
IMG_ARCH=$(docker inspect -f '{{.Os}}/{{.Architecture}}' $IMAGE_NAME 2>/dev/null)
HOST_ARCH=$(uname -m)

if [[ "$HOST_ARCH" == "arm64" && "$IMG_ARCH" == "linux/amd64" ]]; then
    if [[ -z "$PLATFORM_FLAG" ]]; then
        echo "Note: Running AMD64 image on Apple Silicon. Adding --platform linux/amd64 automatically."
        PLATFORM_FLAG="--platform linux/amd64"
    elif [[ "$PLATFORM_FLAG" == "--platform linux/arm64" ]]; then
        echo "WARNING: You requested linux/arm64 but the image is linux/amd64. This will likely fail."
    fi
fi

echo "Preparing data directory..."
mkdir -p $DATA_DIR

echo "Stopping old container (if exists)..."
docker stop mf24-container 2>/dev/null || true
docker rm mf24-container 2>/dev/null || true

echo "Running application..."
docker run \
  --name mf24-container \
  $PLATFORM_FLAG \
  --restart unless-stopped \
  -p 80:8080 \
  -v "$(pwd)/$DATA_DIR:/app/data-records" \
  -e ENV_NAME=experiment \
  $IMAGE_NAME

echo "Application is running at http://localhost"
echo "    Data is being saved to: $(pwd)/$DATA_DIR"
