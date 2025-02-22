#!/bin/bash
set -e  # Exit on error

echo "Setting up yt-dlp from local files"

# Ensure ffmpeg is installed
apt-get update && apt-get install -y ffmpeg

# Set executable permissions for yt-dlp
chmod +x ./bin/yt-dlp.exe

# Verify that yt-dlp is executable
if ./bin/yt-dlp.exe --version &> /dev/null; then
    echo "✅ yt-dlp is ready to use!"
else
    echo "❌ yt-dlp setup failed! Check permissions."
    exit 1
fi

echo "Setup complete!"
