// Replace these with your Spotify API credentials
const CLIENT_ID = 'YOUR_CLIENT_ID';
const REDIRECT_URI = window.location.origin; // This will automatically use your Vercel deployment URL

// Spotify API endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Required scopes for the application
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
];

// Load the Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = () => {
    const token = getAccessToken();
    if (!token) return;

    const player = new Spotify.Player({
        name: "Wizzy's Cafe Player",
        getOAuthToken: cb => { cb(token); }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        if (state) {
            updatePlaybackState(state);
        }
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        window.deviceId = device_id;
    });

    // Connect to the player
    player.connect();
    window.spotifyPlayer = player;
};

// Generate random string for state
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Get the access token from URL parameters
function getAccessToken() {
    const params = new URLSearchParams(window.location.hash.substring(1));
    return params.get('access_token');
}

// Initialize Spotify authentication
function initializeSpotifyAuth() {
    const state = generateRandomString(16);
    
    const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?` +
        `client_id=${CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
        `&response_type=token` +
        `&state=${state}`;

    // If we don't have an access token, redirect to Spotify auth
    if (!getAccessToken()) {
        window.location = authUrl;
    }
} 
