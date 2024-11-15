const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Save authentication state in a local file
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Start the WhatsApp bot
async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Save updated credentials
    sock.ev.on('creds.update', saveState);

    // Message handler
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message) return;

        const sender = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        if (!text) return;

        console.log(`Received message: ${text} from ${sender}`);

        // Main commands
        if (text === '!ping') {
            await sock.sendMessage(sender, { text: 'Pong! 🏓' });
        } else if (text === '!alive') {
            await sock.sendMessage(sender, { text: 'I am alive and running! 💥' });
        } else if (text === '!menu') {
            const menuMessage = `
*Available Commands:*
1. *!ping* - Check if the bot is alive.
2. *!alive* - Check bot's current status.
3. *!runtime* - Get bot runtime details.
4. *!sticker* - Convert an image to a sticker (send with caption "!sticker").
5. *!ytdl <YouTube_URL>* - Download a YouTube video.
6. *!fbdl <Facebook_URL>* - Download a Facebook video.
7. *!tiktokdl <TikTok_URL>* - Download a TikTok video.
8. *!instadl <Instagram_URL>* - Download an Instagram video.
9. *!song <Song_Name>* - Search for a song.
10. *!video <Video_Name>* - Search for a video.
11. *!apk <APK_Name>* - Download an APK file.
12. *!movie <Movie_Name>* - Search for a movie.
13. *!spotify <Song_Name>* - Get details for a song on Spotify.
            `;
            await sock.sendMessage(sender, { text: menuMessage });
        } else if (text === '!runtime') {
            const uptime = process.uptime();
            await sock.sendMessage(sender, { text: `Bot has been running for ${Math.floor(uptime / 60)} minutes and ${Math.floor(uptime % 60)} seconds.` });
        } else if (text.startsWith('!sticker')) {
            await convertToSticker(sock, sender, message);
        } else if (text.startsWith('!ytdl')) {
            await handleYouTubeDownload(sock, sender, text);
        } else if (text.startsWith('!fbdl')) {
            await handleFacebookDownload(sock, sender, text);
        } else if (text.startsWith('!tiktokdl')) {
            await handleTikTokDownload(sock, sender, text);
        } else if (text.startsWith('!instadl')) {
            await handleInstagramDownload(sock, sender, text);
        } else if (text.startsWith('!song')) {
            await searchSong(sock, sender, text);
        } else if (text.startsWith('!video')) {
            await searchVideo(sock, sender, text);
        } else if (text.startsWith('!apk')) {
            await handleApkDownload(sock, sender, text);
        } else if (text.startsWith('!movie')) {
            await searchMovie(sock, sender, text);
        } else if (text.startsWith('!spotify')) {
            await searchSpotify(sock, sender, text);
        }
    });

    // Connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 'Unknown';
            console.log(`Connection closed. Reason: ${reason}`);
            if (reason !== DisconnectReason.loggedOut) {
                startBot(); // Reconnect
            }
        } else if (connection === 'open') {
            console.log('Bot is online and ready!');
        }
    });
}

// Convert image to sticker
async function convertToSticker(sock, sender, message) {
    const media = await sock.downloadMediaMessage(message);
    const stickerPath = './sticker.webp';
    const inputImagePath = './input_image.jpg';

    fs.writeFileSync(inputImagePath, media);
    exec(`ffmpeg -i ${inputImagePath} -vf "scale=512:512:force_original_aspect_ratio=decrease" ${stickerPath}`, async (error) => {
        if (error) {
            await sock.sendMessage(sender, { text: '❌ Failed to create sticker. Ensure ffmpeg is installed.' });
            return;
        }
        await sock.sendMessage(sender, { sticker: { url: stickerPath } });
        fs.unlinkSync(inputImagePath); // Cleanup
        fs.unlinkSync(stickerPath);
    });
}

// YouTube download handler (Placeholder)
async function handleYouTubeDownload(sock, sender, text) {
    const url = text.split(' ')[1];
    if (!url) {
        await sock.sendMessage(sender, { text: '❌ Please provide a valid YouTube URL.' });
        return;
    }

    await sock.sendMessage(sender, { text: `⏳ Downloading YouTube video: ${url}...` });
    // Actual download logic should be here using yt-dlp or a similar tool
}

// Facebook download handler (Placeholder)
async function handleFacebookDownload(sock, sender, text) {
    const url = text.split(' ')[1];
    if (!url) {
        await sock.sendMessage(sender, { text: '❌ Please provide a valid Facebook video URL.' });
        return;
    }

    await sock.sendMessage(sender, { text: `⏳ Downloading Facebook video: ${url}...` });
    // Actual download logic should be here
}

// TikTok download handler (Placeholder)
async function handleTikTokDownload(sock, sender, text) {
    const url = text.split(' ')[1];
    if (!url) {
        await sock.sendMessage(sender, { text: '❌ Please provide a valid TikTok URL.' });
        return;
    }

    await sock.sendMessage(sender, { text: `⏳ Downloading TikTok video: ${url}...` });
    // Actual download logic should be here
}

// Instagram download handler (Placeholder)
async function handleInstagramDownload(sock, sender, text) {
    const url = text.split(' ')[1];
    if (!url) {
        await sock.sendMessage(sender, { text: '❌ Please provide a valid Instagram URL.' });
        return;
    }

    await sock.sendMessage(sender, { text: `⏳ Downloading Instagram video: ${url}...` });
    // Actual download logic should be here
}

// Song search handler (Placeholder)
async function searchSong(sock, sender, text) {
    const song = text.split(' ').slice(1).join(' ');
    if (!song) {
        await sock.sendMessage(sender, { text: '❌ Please provide a song name to search.' });
        return;
    }

    await sock.sendMessage(sender, { text: `🔍 Searching for song: ${song}...` });
    // Implement song search logic using APIs or external libraries
}

// Video search handler (Placeholder)
async function searchVideo(sock, sender, text) {
    const video = text.split(' ').slice(1).join(' ');
    if (!video) {
        await sock.sendMessage(sender, { text: '❌ Please provide a video name to search.' });
        return;
    }

    await sock.sendMessage(sender, { text: `🔍 Searching for video: ${video}...` });
    // Implement video search logic using APIs or external libraries
}

// APK download handler (Placeholder)
async function handleApkDownload(sock, sender, text) {
    const apkName = text.split(' ')[1];
    if (!apkName) {
        await sock.sendMessage(sender, { text: '❌ Please provide the APK name.' });
        return;
    }

    await sock.sendMessage(sender, { text: `📥 Downloading APK: ${apkName}...` });
    // Implement APK download logic
}

// Movie search handler (Placeholder)
async function searchMovie(sock, sender, text) {
    const movie = text.split(' ').slice(1).join(' ');
    if (!movie) {
        await sock.sendMessage(sender, { text: '❌ Please provide a movie name to search.' });
        return;
    }

    await sock.sendMessage(sender, { text: `🔍 Searching for movie: ${movie}...` });
    // Implement movie search logic
}

// Spotify search handler (Placeholder)
async function searchSpotify(sock, sender, text) {
    const song = text.split(' ').slice(1).join(' ');
    if (!song) {
        await sock.sendMessage(sender, { text: '❌ Please provide a song name to search on Spotify.' });
        return;
    }

    await sock.sendMessage(sender, { text: `🔍 Searching Spotify for song: ${song}...` });
    // Implement Spotify search logic
}

// Start the bot
startBot();
