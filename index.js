const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// TMDb API Configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // Replace with your TMDb API Key

// Authentication state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Bot start time
const startTime = Date.now();

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Display QR code in terminal
    });

    // Save authentication state
    sock.ev.on('creds.update', saveState);

    // Display QR code
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log('📲 Scan the QR Code below to connect:');
            qrcode.generate(qr, { small: true }); // Display QR code in terminal
        }

        if (connection === 'open') {
            console.log('✅ Bot is connected!');
        } else if (connection === 'close') {
            console.log('🔌 Connection closed. Reconnecting...');
            startBot(); // Reconnect automatically
        }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message) return;

        const sender = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        if (!text) return;

        console.log(`📩 Message received: ${text} from ${sender}`);

        // Command handling
        if (text.startsWith('.ping')) {
            const latency = Date.now() - startTime;
            await sock.sendMessage(sender, { text: `🔥Latency : ${latency}ms` });
        } else if (text.startsWith('.menu')) {
            const menuMessage = `
📜 *Movie Bot Commands:*

🎥 .topmovies - Get the top trending movies.
🎬 .upcoming - Get upcoming movies.
📺 .nowplaying - Get currently playing movies in theaters.
🔍 .search <movie_name> - Search for a movie.
📂 .getmovie <movie_id> - Download a movie by ID.
📖 .moviedetails <movie_id> - Get detailed information about a movie.
📂 .getsimilar <movie_id> - Get similar movies.
📜 .help - View this help menu.
🏓 .ping - Check bot speed.
⚡ .alive - Check bot uptime.
            `;
            const thumbnailBuffer = await getThumbnailImage();  // Get thumbnail image
            await sock.sendMessage(sender, {
                text: menuMessage,
                mentions: [sender], // Mentions the sender
                thumbnail: thumbnailBuffer,  // Attach the thumbnail image
            });
        } else if (text.startsWith('.alive')) {
            const uptime = formatUptime(Date.now() - startTime);
            await sock.sendMessage(sender, { text: `🤖 The bot has been alive for: ${uptime}` });
        } else if (text.startsWith('.help')) {
            await sock.sendMessage(sender, { text: 'ℹ️ Use .menu to see all commands!' });
        } else if (text.startsWith('.topmovies')) {
            await sendTopMovies(sock, sender);
        } else if (text.startsWith('.upcoming')) {
            await sendUpcomingMovies(sock, sender);
        } else if (text.startsWith('.nowplaying')) {
            await sendNowPlayingMovies(sock, sender);
        } else if (text.startsWith('.search')) {
            const query = text.split(' ').slice(1).join(' ');
            if (!query) {
                await sock.sendMessage(sender, { text: '❌ Please provide a movie name to search.' });
                return;
            }
            await searchMovie(query, sock, sender);
        } else if (text.startsWith('.getmovie')) {
            const movieId = text.split(' ')[1];
            if (!movieId) {
                await sock.sendMessage(sender, { text: '❌ Please provide a movie ID to download.' });
                return;
            }
            await getMovieFile(movieId, sock, sender);
        } else if (text.startsWith('.moviedetails')) {
            const movieId = text.split(' ')[1];
            if (!movieId) {
                await sock.sendMessage(sender, { text: '❌ Please provide a movie ID to get details.' });
                return;
            }
            await getMovieDetails(movieId, sock, sender);
        } else if (text.startsWith('.getsimilar')) {
            const movieId = text.split(' ')[1];
            if (!movieId) {
                await sock.sendMessage(sender, { text: '❌ Please provide a movie ID to get similar movies.' });
                return;
            }
            await getSimilarMovies(movieId, sock, sender);
        }
    });
}

// Fetch top trending movies
async function sendTopMovies(sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movies = response.data.results.slice(0, 10); // Top 10 movies
        let message = '🎥 *Top Trending Movies:*\n\n';
        movies.forEach((movie, index) => {
            message += `🎬 *${index + 1}. ${movie.title}*\n📆 Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}/10\n🔗 ID: ${movie.id}\n\n`;
        });
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching top movies.' });
    }
}

// Fetch upcoming movies
async function sendUpcomingMovies(sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movies = response.data.results.slice(0, 10); // Top 10 upcoming movies
        let message = '🎬 *Upcoming Movies:*\n\n';
        movies.forEach((movie, index) => {
            message += `🎥 *${index + 1}. ${movie.title}*\n📆 Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}/10\n🔗 ID: ${movie.id}\n\n`;
        });
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching upcoming movies.' });
    }
}

// Fetch movies currently playing
async function sendNowPlayingMovies(sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movies = response.data.results.slice(0, 10); // Top 10 now playing movies
        let message = '🎬 *Now Playing Movies:*\n\n';
        movies.forEach((movie, index) => {
            message += `🎥 *${index + 1}. ${movie.title}*\n📆 Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}/10\n🔗 ID: ${movie.id}\n\n`;
        });
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching now playing movies.' });
    }
}

// Search for a movie
async function searchMovie(query, sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: { api_key: TMDB_API_KEY, query },
        });
        const movies = response.data.results.slice(0, 5); // Top 5 search results
        let message = `🔍 *Search Results for "${query}":*\n\n`;
        movies.forEach((movie, index) => {
            message += `🎬 *${index + 1}. ${movie.title}*\n📆 Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}/10\n🔗 ID: ${movie.id}\n\n`;
        });
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error searching for movie.' });
    }
}

// Provide a downloadable movie file
async function getMovieFile(movieId, sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movie = response.data;
        const fileUrl = `https://example.com/download/${movieId}.mp4`; // Replace with actual movie file URL
        await sock.sendMessage(sender, {
            text: `📂 Download the movie *${movie.title}* here: ${fileUrl}`,
        });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching movie file.' });
    }
}

// Get detailed movie information
async function getMovieDetails(movieId, sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movie = response.data;
        let message = `🎥 *Movie Details:*\n\n`;
        message += `🎬 *Title:* ${movie.title}\n`;
        message += `📆 *Release Date:* ${movie.release_date}\n`;
        message += `⭐ *Rating:* ${movie.vote_average}/10\n`;
        message += `📝 *Overview:* ${movie.overview}\n`;
        message += `🎞️ *Genres:* ${movie.genres.map(g => g.name).join(', ')}\n`;
        message += `📸 *Poster:* ${TMDB_BASE_URL}/t/p/w500${movie.poster_path}\n`;
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching movie details.' });
    }
}

// Get similar movies
async function getSimilarMovies(movieId, sock, sender) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/similar`, {
            params: { api_key: TMDB_API_KEY },
        });
        const movies = response.data.results.slice(0, 5); // Top 5 similar movies
        let message = `🎬 *Similar Movies to ${movieId}:*\n\n`;
        movies.forEach((movie, index) => {
            message += `🎥 *${index + 1}. ${movie.title}*\n📆 Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}/10\n🔗 ID: ${movie.id}\n\n`;
        });
        await sock.sendMessage(sender, { text: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Error fetching similar movies.' });
    }
}

// Format uptime into human-readable form
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days} 📆Days, ${hours % 24} ⏲️Hours, ${minutes % 60} ⏰Minutes, ${seconds % 60} ⏱️Seconds`;
}

// Get thumbnail image for menu
async function getThumbnailImage() {
    const thumbnailPath = path.join(__dirname, 'thumbnail.jpg'); // Path to your thumbnail image
    return fs.promises.readFile(thumbnailPath); // Return thumbnail image buffer
}

startBot();
