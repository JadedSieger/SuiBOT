#!/bin/bash

echo "Updating package list and installing dependencies"
apt-get update && apt-get install -y ffmpeg

echo "Installing yt-dlp"
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "Verifying yt-dlp installation"
yt-dlp --version || echo "yt-dlp installation failed!"

echo "Installation Complete"
