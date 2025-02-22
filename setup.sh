#!/bin/bash

echo "Updating package list and installing dependencies"
apt-get update && apt-get install -y ffmpeg curl

echo "Installing yt-dlp"
curl -L --retry 5 --progress-bar https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp

if [ -f "/usr/bin/yt-dlp" ]; then
    chmod a+rx /usr/bin/yt-dlp
    echo "✅ yt-dlp downloaded successfully!"
else
    echo "❌ Failed to download yt-dlp! Retrying..."
    exit 1
fi

echo "Verifying yt-dlp installation"
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp installed successfully!"
else
    echo "❌ yt-dlp installation failed! Check permissions or retry."
    exit 1
fi

echo "Installation Complete"
