#!/bin/bash
set -e  # Exit on error

echo "Setting up yt-dlp from local files"

# Ensure dependencies are installed
apt-get update && apt-get install -y ffmpeg python3 python3-pip wine

# Install yt-dlp via pip
pip3 install -U yt-dlp

# Verify Python yt-dlp installation
if yt-dlp --version &> /dev/null; then
    echo "✅ Python yt-dlp installed successfully!"
else 
    echo "❌ Python yt-dlp installation failed!"
    exit 0
fi

# If you must use yt-dlp.exe, enable this section
if [ -f "./bin/yt-dlp.exe" ]; then
    apt-get install -y wine
    sudo chown $(whoami) ./bin/yt-dlp.exe
    chmod +x ./bin/yt-dlp.exe
    if wine ./bin/yt-dlp.exe --version &> /dev/null; then
        echo "✅ yt-dlp.exe is ready to use!"
    else
        echo "❌ yt-dlp.exe setup failed! Check Wine."
        exit 0
    fi
fi

echo "Setup complete!"
