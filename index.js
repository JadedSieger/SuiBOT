require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    StreamType 
} = require("@discordjs/voice");
const { spawn } = require("child_process");
const { google } = require("googleapis");

const token = process.env.token;
const prefix = process.env.prefix1 || process.env.prefix2 || "!";
const youtubeApiKey = process.env.y_ApiKey;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const genAI = new GoogleGenerativeAI(process.env.g_ApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const queue = new Map();

client.on("ready", () => {
    console.log("Sui-chan is online!");
    client.user.setActivity("Suisei Channel", { type: ActivityType.Streaming });
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    
    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(prefix + "play")) {
        await execute(message, serverQueue);
    } else if (message.content.startsWith(prefix + "stop")) {
        stop(message, serverQueue);
    } else if (message.content.startsWith(prefix + "pause")) {
        pause(serverQueue);
    } else if (message.content.startsWith(prefix + "resume")) {
        resume(serverQueue);
    } else if (message.content.startsWith(prefix + "next")) {
        skip(message, serverQueue);
    } else if (message.content.startsWith(prefix + "queue")) {
        showQueue(message, serverQueue);
    } else if (message.content.startsWith(prefix + "clear")) {
        clearQueue(message, serverQueue);
    } else if (message.content.startsWith(prefix + "disconnect")) {
        disconnect(message, serverQueue);
    }
});

async function execute(message, serverQueue) {
    const query = message.content.slice(prefix.length + 4).trim();
    if (!query) return message.reply("Please provide a song request!");
    
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply("You need to **join a voice channel** first!");

    const result = await model.generateContent(`Suggest a song based on: ${query}. Only return '{title} - {artist}'.`);
    const response = await result.response.text();
    const match = response.match(/(.+?)\s*-\s*(.+)/);
    if (!match) return message.reply("Couldn't find a valid song.");

    const songTitle = match[1].trim();
    const artist = match[2].trim();
    
    const searchResults = await fetchYouTubeResults(`${songTitle} ${artist}`);
    const selectedVideo = searchResults.length > 0 ? searchResults[0] : null;
    if (!selectedVideo) return message.reply("Couldn't find a suitable music video.");

    const song = { title: selectedVideo.title, url: selectedVideo.url };

    if (!serverQueue) {
        const queueConstruct = {
            voiceChannel,
            connection: null,
            songs: [],
            player: createAudioPlayer()
        };
        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);
        message.reply(`🎶 Now playing: **${song.title}**`);
        
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.error(err);
            queue.delete(message.guild.id);
            return message.reply("Error connecting to voice channel!");
        }
    } else {
        serverQueue.songs.push(song);
        return message.reply(`🎶 Added **${song.title}** to the queue!`);
    }
}

function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue || !song) {
        if (serverQueue?.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guild.id);
        return;
    }
    const stream = getStream(song.url);
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
    serverQueue.player.play(resource);
    serverQueue.connection.subscribe(serverQueue.player);
    serverQueue.player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    });
}
function stop(message, serverQueue) {
    if (!serverQueue) return message.reply("No song is currently playing.");
    serverQueue.songs = [];
    serverQueue.player.stop();
    serverQueue.connection.destroy();
    queue.delete(message.guild.id);
    message.reply("Stopped playback and left the voice channel.");
}

function getStream(url) {
    return spawn("yt-dlp", ["-f", "bestaudio", "--no-playlist", "-o", "-", url], { stdio: ["ignore", "pipe", "ignore"] }).stdout;
}

async function fetchYouTubeResults(query) {
    const youtube = google.youtube({ version: "v3", auth: youtubeApiKey });
    const response = await youtube.search.list({
        part: "snippet",
        q: query,
        maxResults: 10,
        type: "video",
    });
    return response.data.items.filter(video =>
        video.snippet.title.toLowerCase().includes("official") ||
        video.snippet.title.toLowerCase().includes("mv") ||
        video.snippet.title.toLowerCase().includes("music video") ||
        video.snippet.title.toLowerCase().includes("cover") ||
        video.snippet.title.toLowerCase().includes("original") ||
        video.snippet.title.toLowerCase().includes("original song")||
        video.snippet.title.toLowerCase().includes(songTitle.toLowerCase() + " - " + artist.toLowerCase())|| 
        video.snippet.title.toLowerCase().includes(artist.toLowerCase() + " - " + songTitle.toLowerCase())
    ).map(video => ({ title: video.snippet.title, url: `https://www.youtube.com/watch?v=${video.id.videoId}` }));
}


function showQueue(message, serverQueue) {
    if (!serverQueue || serverQueue.songs.length === 0) {
        return message.reply("The queue is currently empty.");
    }

    const queueMessage = serverQueue.songs
        .map((song, index) => `${index + 1}. **${song.title}**`)
        .join("\n");

    message.reply(`🎵 **Current Queue:**\n${queueMessage}`);
}

module.exports = client;
client.login(token);
