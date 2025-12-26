const https = require('https');

/**
 * Keeps the Render backend active by pinging it every 14 minutes.
 * Render free tier sleeps after 15 minutes of inactivity.
 * @param {string} url - The backend health check URL.
 */
const startKeepAlive = (url) => {
    if (!url) {
        console.warn('Keep-alive: No URL provided. Skipping...');
        return;
    }

    console.log(`Keep-alive: Started for ${url}`);

    // Ping every 14 minutes (14 * 60 * 1000 ms)
    setInterval(() => {
        https.get(url, (res) => {
            console.log(`Keep-alive: Ping status code ${res.statusCode} at ${new Date().toISOString()}`);
        }).on('error', (err) => {
            console.error('Keep-alive: Ping error:', err.message);
        });
    }, 14 * 60 * 1000);
};

module.exports = { startKeepAlive };
