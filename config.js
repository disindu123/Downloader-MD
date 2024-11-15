module.exports = {
    // Authentication and session information
    authFilePath: './auth_info.json', // Path for storing authentication state

    // File paths for downloads and stickers
    downloadPath: './downloads/', // Path for saving downloaded media files (songs, videos, etc.)
    stickerPath: './sticker.webp', // Path for temporarily saving stickers before sending them

    // FFmpeg configuration for sticker conversion
    ffmpegPath: '/usr/bin/ffmpeg', // Specify the path to ffmpeg binary if it's not globally installed

    // Bot information
    botName: 'Downloader-MD', // The name of your bot
    botPrefix: '.', // Command prefix (change this as needed)

    // External service/API configuration (e.g., YouTube, Spotify, etc.)
    ytDLPPath: '/usr/local/bin/yt-dlp', // Path to yt-dlp binary (can be different based on the OS)
    ytdlCommand: 'yt-dlp', // Command to invoke for YouTube video downloads

    // Timeout settings (in milliseconds)
    timeout: 30000, // Timeout for external processes like downloading

    // Proxy settings (if using a proxy server)
    proxy: {
        enabled: false, // Set to true to enable proxy
        host: 'proxy.example.com', // Proxy host
        port: 8080, // Proxy port
        username: '', // Optional proxy username
        password: '', // Optional proxy password
    },

    // Error handling settings
    errorLogging: true, // Set to true to enable error logging
    logFilePath: './error.log', // Path to store error logs

    // Other configurations
    maxDownloadSize: 50 * 1024 * 1024, // Maximum file size for downloads (50MB)
};
