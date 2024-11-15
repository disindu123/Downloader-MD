const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Save authentication state to a file
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Get the current time and uptime of the bot
const startTime = Date.now();

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Save authentication state whenever it changes
    sock.ev.on('creds.update', saveState);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message) return;

        const sender = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        if (!text) return;

        console.log(`Received message: ${text} from ${sender}`);

        // Command handling
        if (text.startsWith('.ping')) {
            await sock.sendMessage(sender, { text: 'Pong! 🏓' });
        } else if (text.startsWith('.alive')) {
            await sock.sendMessage(sender, { text: '✅ Hey,The bot is alive and running! 🫡' });
        } else if (text.startsWith('.menu')) {
            const menuMessage = `
╭──────────────────━┈⊷
│◦ 🤖ʙᴏᴛ ɴᴀᴍᴇ : *DOWNLOADER-MD*
│◦ 👤ᴏᴡɴᴇʀ ɴᴀᴍᴇ : *Cyber DissA*
│◦ ☎ᴏᴡɴᴇʀ ɴᴜᴍ : *+94775704025*
│◦ ⏰ᴜᴘᴛɪᴍᴇ : *0ᴅᴀʏ 0ʜʀs 3ᴍɪɴs*
│◦ 💾ʀᴀᴍ : *857.19 MB / 3.7 GB*
│◦ 🛡ᴘʟᴀᴛғᴏʀᴍ : *Unkown*
│◦ 💫ᴘʀᴇғɪx : *[.]*
╰──────────────────━┈⊷

➤❮ *All Commands* ❯

1. .ping - Check if the bot is online.
2. .alive - Check if the bot is alive.
3. .song <song_name> - Download a song.
4. .video <video_url> - Download a video.
5. .facebook <url> - Download a Facebook video.
6. .tiktok <url> - Download a TikTok video.
7. .instagram <url> - Download an Instagram video.
8. .ytdl <YouTube_url> - Download a YouTube video.
9. .spotify <song_name> - Search and download a Spotify song.
10. .apk <apk_name> - Download an APK.
11. .sticker - Convert an image to a sticker.
12. .movie <movie_name> - Download a movie.
13. .runtime - Get the bot's runtime.
14. .uptime - Get the bot's uptime.
            `;
            await sock.sendMessage(sender, { text: menuMessage });
        } else if (text.startsWith('.song')) {
            const songName = text.split(' ').slice(1).join(' ');
            if (!songName) {
                await sock.sendMessage(sender, { text: '❌ Please provide the song name.' });
                return;
            }
            await downloadSong(songName, sock, sender);
        } else if (text.startsWith('.video')) {
            const videoUrl = text.split(' ').slice(1).join(' ');
            if (!videoUrl) {
                await sock.sendMessage(sender, { text: '❌ Please provide a video URL.' });
                return;
            }
            await downloadVideo(videoUrl, sock, sender);
        } else if (text.startsWith('.facebook')) {
            const url = text.split(' ').slice(1).join(' ');
            await downloadFacebookVideo(url, sock, sender);
        } else if (text.startsWith('.tiktok')) {
            const url = text.split(' ').slice(1).join(' ');
            await downloadTikTokVideo(url, sock, sender);
        } else if (text.startsWith('.instagram')) {
            const url = text.split(' ').slice(1).join(' ');
            await downloadInstagramVideo(url, sock, sender);
        } else if (text.startsWith('.ytdl')) {
            const url = text.split(' ').slice(1).join(' ');
            await downloadYouTubeVideo(url, sock, sender);
        } else if (text.startsWith('.spotify')) {
            const songName = text.split(' ').slice(1).join(' ');
            await downloadSpotifySong(songName, sock, sender);
        } else if (text.startsWith('.apk')) {
            const apkName = text.split(' ').slice(1).join(' ');
            await downloadAPK(apkName, sock, sender);
        } else if (text.startsWith('.sticker')) {
            if (message.message.imageMessage) {
                await convertToSticker(sock, sender, message);
            } else {
                await sock.sendMessage(sender, { text: '❌ Please send an image with the caption "!sticker".' });
            }
        } else if (text.startsWith('.movie')) {
            const movieName = text.split(' ').slice(1).join(' ');
            await downloadMovie(movieName, sock, sender);
        } else if (text.startsWith('.runtime')) {
            const runtime = Math.floor((Date.now() - startTime) / 1000);
            await sock.sendMessage(sender, { text: `🤖 Bot runtime: ${runtime} seconds.` });
        } else if (text.startsWith('.uptime')) {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            await sock.sendMessage(sender, { text: `🤖 Bot uptime: ${hours}h ${minutes}m ${seconds}s` });
        }
    });

    // Connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || 'Unknown';
            console.log(`Connection closed. Reason: ${reason}`);
            if (reason !== DisconnectReason.loggedOut) {
                startBot(); // Reconnect automatically if not logged out
            }
        } else if (connection === 'open') {
            console.log('Bot is online!');
        }
    });
}

// Function to download a song
async function downloadSong(songName, sock, sender) {
    // Replace with actual song download logic
    const songPath = './downloads/song.mp3';
    exec(`youtube-dl -x --audio-format mp3 "${songName}" -o ${songPath}`, async (error, stdout, stderr) => {
        if (error) {
            await sock.sendMessage(sender, { text: `❌ Error downloading song: ${stderr || error.message}` });
            return;
        }
        await sock.sendMessage(sender, {
            audio: { url: songPath },
            caption: `🎶 Here is your song: ${songName}`,
        });
        fs.unlinkSync(songPath);
    });
}

// Function to download a video
async function downloadVideo(url, sock, sender) {
    const videoPath = './downloads/video.mp4';
    exec(`yt-dlp -f bestvideo+bestaudio -o "${videoPath}" "${url}"`, async (error, stdout, stderr) => {
        if (error) {
            await sock.sendMessage(sender, { text: `❌ Error downloading video: ${stderr || error.message}` });
            return;
        }
        await sock.sendMessage(sender, {
            video: { url: videoPath },
            caption: '🎥 Here is your video!',
        });
        fs.unlinkSync(videoPath);
    });
}

// Placeholder function for Facebook video download
async function downloadFacebookVideo(url, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 Facebook video download feature is under construction.' });
}

// Placeholder function for TikTok video download
async function downloadTikTokVideo(url, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 TikTok video download feature is under construction.' });
}

// Placeholder function for Instagram video download
async function downloadInstagramVideo(url, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 Instagram video download feature is under construction.' });
}

// Placeholder function for YouTube video download
async function downloadYouTubeVideo(url, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 YouTube video download feature is under construction.' });
}

// Placeholder function for Spotify song download
async function downloadSpotifySong(songName, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 Spotify song download feature is under construction.' });
}

// Placeholder function for APK download
async function downloadAPK(apkName, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 APK download feature is under construction.' });
}

// Convert image to sticker
async function convertToSticker(sock, sender, message) {
    const media = await sock.downloadMediaMessage(message);
    const stickerPath = './sticker.webp';
    fs.writeFileSync(stickerPath, media);
    exec(`ffmpeg -i ${stickerPath} ${stickerPath}`, async (error) => {
        if (error) {
            await sock.sendMessage(sender, { text: '❌ Failed to create sticker.' });
            return;
        }
        await sock.sendMessage(sender, {
            sticker: { url: stickerPath },
        });
        fs.unlinkSync(stickerPath); // Clean up
    });
}

// Placeholder function for movie download
async function downloadMovie(movieName, sock, sender) {
    await sock.sendMessage(sender, { text: '🚧 Movie download feature is under construction.' });
}

// Start the bot
startBot();
