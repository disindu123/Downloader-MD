const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const moment = require('moment');
const ytDl = require('yt-dlp');

// Save authentication state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Global variables for uptime and runtime tracking
let botStartTime = moment();

// Start the bot
async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Save updated credentials
    sock.ev.on('creds.update', saveState);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message) return;

        const sender = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        if (!text) return;

        console.log(`Received message: ${text} from ${sender}`);

        // Commands
        if (text === '!ping') {
            await sock.sendMessage(sender, { text: 'Pong! 🏓' });
        } else if (text === '!alive') {
            await sock.sendMessage(sender, { text: '✅ Bot is alive and running!' });
        } else if (text === '!uptime') {
            const uptime = moment.duration(moment().diff(botStartTime)).humanize();
            await sock.sendMessage(sender, { text: `Uptime: ${uptime}` });
        } else if (text === '!runtime') {
            const runtime = process.uptime();
            await sock.sendMessage(sender, { text: `Runtime: ${runtime.toFixed(2)} seconds` });
        } else if (text === '!menu') {
            const menuText = `
*Available Commands:*
1. *!ping* - Check if the bot is online.
2. *!alive* - Check if the bot is running.
3. *!uptime* - Check bot's uptime.
4. *!runtime* - Check bot's runtime.
5. *!ytdl <YouTube_URL>* - Download a YouTube video.
6. *!song <Song Name>* - Search and download a song.
7. *!video <Video URL>* - Download a video (YouTube, Facebook, etc).
8. *!facebook <Facebook URL>* - Download a Facebook video.
9. *!instagram <Instagram URL>* - Download an Instagram video.
10. *!tiktok <TikTok URL>* - Download a TikTok video.
11. *!spotify <Song URL>* - Download a song from Spotify.
12. *!apk <App Name>* - Search and download an APK file.
13. *!movie <Movie Name>* - Search and download a movie.
            `;
            await sock.sendMessage(sender, { text: menuText });
        } else if (text.startsWith('!song')) {
            await handleSongDownload(sock, sender, text);
        } else if (text.startsWith('!video')) {
            await handleVideoDownload(sock, sender, text);
        } else if (text.startsWith('!ytdl')) {
            await handleYouTubeDownload(sock, sender, text);
        } else if (text.startsWith('!facebook')) {
            await handleFacebookDownload(sock, sender, text);
        } else if (text.startsWith('!instagram')) {
            await handleInstagramDownload(sock, sender, text);
        } else if (text.startsWith('!tiktok')) {
            await handleTikTokDownload(sock, sender, text);
        } else if (text.startsWith('!spotify')) {
            await handleSpotifyDownload(sock, sender, text);
        } else if (text.startsWith('!apk')) {
            await handleApkDownload(sock, sender, text);
        } else if (text.startsWith('!movie')) {
            await handleMovieDownload(sock, sender, text);
        }
    });

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 'Unknown';
            console.log(`Connection closed. Reason: ${reason}`);
            if (reason !== DisconnectReason.loggedOut) {
                startBot(); // Reconnect automatically
            }
        } else if (connection === 'open') {
            console.log('Bot is online and ready to receive messages!');
        }
    });
}

// Helper function to download YouTube video
async function handleYouTubeDownload(sock, sender, text) {
    const url = text.split(' ')[1];
    if (!url) {
        await sock.sendMessage(sender, { text: '❌ Please provide a valid YouTube URL.' });
        return;
    }

    const outputDir = './downloads';
    const outputFilePath = path.join(outputDir, 'video.mp4');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await sock.sendMessage(sender, { text: '⏳ Downloading YouTube video, please wait...' });

    exec(`yt-dlp -f 'best[ext=mp4]' -o "${outputFilePath}" "${url}"`, async (error, stdout, stderr) => {
        if (error) {
            await sock.sendMessage(sender, { text: `❌ Error downloading video: ${stderr || error.message}` });
            return;
        }

        await sock.sendMessage(sender, {
            video: { url: outputFilePath },
            caption: '🎥 Here is your downloaded video!',
        });

        fs.unlinkSync(outputFilePath); // Clean up after sending
    });
}

// Helper function to download a song
async function handleSongDownload(sock, sender, text) {
    const songName = text.split(' ').slice(1).join(' ');
    if (!songName) {
        await sock.sendMessage(sender, { text: '❌ Please provide a song name.' });
        return;
    }

    const outputDir = './downloads';
    const outputFilePath = path.join(outputDir, 'song.mp3');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await sock.sendMessage(sender, { text: '⏳ Searching for song, please wait...' });

    // You can use an API like `yt-dlp` or others for music downloads (just an example here)
    exec(`yt-dlp -x --audio-format mp3 -o "${outputFilePath}" "ytsearch:${songName}"`, async (error, stdout, stderr) => {
        if (error) {
            await sock.sendMessage(sender, { text: `❌ Error downloading song: ${stderr || error.message}` });
            return;
        }

        await sock.sendMessage(sender, {
            audio: { url: outputFilePath },
            caption: `🎵 Here is your song: ${songName}`,
        });

        fs.unlinkSync(outputFilePath); // Clean up after sending
    });
}

// Additional handlers for video, Facebook, Instagram, TikTok, Spotify, APK, etc., would be similar

// Start the bot
startBot();
