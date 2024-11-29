module.exports = {
    PREFIX: '.', // Command prefix
    TMDB_API_KEY: '9344af909cf2419cd5e59754f46c9ecb', // Replace with your TMDb API key
    TMDB_BASE_URL: 'https://api.themoviedb.org/3', // Base URL for TMDb API
    THUMBNAIL_PATH: './thumbnail.jpg', // Path to the thumbnail image for the menu
    BOT_NAME: 'Downloader-MD', // Bot name
    OWNER_NAME: 'Your Name', // Your name
    BOT_START_TIME: Date.now(), // Bot start time to calculate uptime
    MESSAGE_EMOJIS: {
        ALIVE: '🌟',
        MENU: '📜',
        PING: '🏓',
        MOVIE: '🎥',
        ERROR: '❌',
        SUCCESS: '✅',
        DOWNLOAD: '📂',
        DETAILS: '📖',
        SIMILAR: '🔗'
    },
    MOVIE_COMMANDS: [
        { command: 'topmovies', description: 'Get top-rated movies.' },
        { command: 'upcomingmovies', description: 'Get upcoming movies.' },
        { command: 'searchmovie <name>', description: 'Search for a movie.' },
        { command: 'moviedetails <id>', description: 'Get details of a specific movie.' },
        { command: 'similarmovies <id>', description: 'Get similar movies.' },
        { command: 'downloadmovie <id>', description: 'Download a movie.' }
    ],
    SUPPORTED_FORMATS: ['pdf', 'doc', 'txt'], // Supported formats for movie file downloads
    CONNECTION_RETRY_INTERVAL: 5000 // Time in milliseconds to wait before retrying connection
};
