export default function handler(req, res) {
    // Enable CORS for your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return API key from environment variable
    res.status(200).json({
        apiKey: process.env.GOOGLE_MAPS_API_KEY
    });
}
