require('dotenv').config();
const express = require('express');
const cors = require('cors');
const client = require("./index"); // Import bot instance

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "https://jadedsieger.github.io" }));
app.use(express.json());


exec("apt-get update && apt-get install -y ffmpeg", (error, stdout, stderr) => {
    if (error) {
        console.error(`Error installing FFmpeg: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`FFmpeg stderr: ${stderr}`);
    }
    console.log(`FFmpeg installed successfully: ${stdout}`);
});


// Start Bot
app.post('/bot/start', async (req, res) => {
    if (client.isReady()) {
        return res.json({ message: "Bot is already running!" });
    }

    try {
        await client.login(process.env.token);

        // Wait for the bot to fully start before sending response
        client.once("ready", () => {
            res.json({ message: "Bot started successfully!" });
        });
    } catch (error) {
        console.error("Error starting bot:", error);
        res.status(500).json({ message: "Error starting bot", error });
    }
});

// Stop Bot
app.post('/bot/stop', async (req, res) => {
    if (!client.isReady()) {
        return res.json({ message: "Bot is not running!" });
    }

    await client.destroy();
    res.json({ message: "Bot stopped successfully!" });
});

// Get Bot Status
app.get('/bot/status', (req, res) => {
    console.log("isReady():", client.isReady());
    res.json({ status: client.isReady() ? "Online" : "Offline" });
});

// Get Bot Name
app.get('/bot/name', (req, res) => {
    res.json({ name: "Lieserl Einstein" });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

