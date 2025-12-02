#!/bin/bash

# Image name and output file
IMAGE_NAME="mf24-app"
OUTPUT_FILE="mf24-app.tar"

echo "Building Docker image (linux/amd64)..."
# Build image without cache to ensure we have the latest version
# Using --platform linux/amd64 to ensure compatibility with standard x86 servers
docker build --platform linux/amd64 -t $IMAGE_NAME .

echo "Saving image to $OUTPUT_FILE..."
# Save image to file
docker save -o $OUTPUT_FILE $IMAGE_NAME

echo "Done! File '$OUTPUT_FILE' is ready for transfer."
echo "    Now you can transfer '$OUTPUT_FILE' and 'run-app.sh' to the target server."
