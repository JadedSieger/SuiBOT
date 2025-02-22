#!/bin/bash

echo "Updating package list and dependencies"
sudo apt-get update && sudo apt-get install -y ffmpeg

echo "Installing yt-dlp"
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp


echo "Installation Complete"