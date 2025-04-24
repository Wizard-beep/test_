// DOM Elements
const genreSelect = document.getElementById('genreSelect');
const artistSelect = document.getElementById('artistSelect');
const getTracksBtn = document.getElementById('getTracksBtn');
const getArtistTracksBtn = document.getElementById('getArtistTracksBtn');
const tracksList = document.getElementById('tracksList');

// Player Elements
const playPauseButton = document.getElementById('playPauseButton');
const playPauseIcon = document.getElementById('playPauseIcon');
const previousButton = document.getElementById('previousButton');
const nextButton = document.getElementById('nextButton');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volumeSlider');
const volumeProgress = document.getElementById('volumeProgress');
const currentTrackImg = document.getElementById('currentTrackImg');
const currentTrackName = document.getElementById('currentTrackName');
const currentTrackArtist = document.getElementById('currentTrackArtist');

let currentTracks = [];
let currentTrackIndex = 0;
let isPlaying = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSpotifyAuth();
    loadGenres();
    loadTopArtists();
    setupPlayerControls();
});

async function loadGenres() {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/recommendations/available-genre-seeds`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        genreSelect.innerHTML = `
            <option value="">Select Genre</option>
            ${data.genres.map(genre => `
                <option value="${genre}">${genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

async function loadTopArtists() {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/me/top/artists?limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        artistSelect.innerHTML = `
            <option value="">Select Artist</option>
            ${data.items.map(artist => `
                <option value="${artist.id}">${artist.name}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

function setupPlayerControls() {
    playPauseButton.addEventListener('click', togglePlayPause);
    previousButton.addEventListener('click', playPreviousTrack);
    nextButton.addEventListener('click', playNextTrack);
    
    // Progress bar control
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (window.spotifyPlayer) {
            window.spotifyPlayer.seek(percent * currentDuration);
        }
    });

    // Volume control
    volumeSlider.addEventListener('click', (e) => {
        const rect = volumeSlider.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (window.spotifyPlayer) {
            window.spotifyPlayer.setVolume(percent);
            volumeProgress.style.width = `${percent * 100}%`;
        }
    });
}

async function togglePlayPause() {
    if (!window.spotifyPlayer) return;

    const state = await window.spotifyPlayer.getCurrentState();
    if (!state) return;

    if (state.paused) {
        window.spotifyPlayer.resume();
        playPauseIcon.className = 'fas fa-pause';
    } else {
        window.spotifyPlayer.pause();
        playPauseIcon.className = 'fas fa-play';
    }
}

async function playTrack(track) {
    if (!window.spotifyPlayer || !window.deviceId) return;

    const token = getAccessToken();
    if (!token) return;

    try {
        await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${window.deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [track.uri]
            })
        });

        updateNowPlaying(track);
        playPauseIcon.className = 'fas fa-pause';
        isPlaying = true;
    } catch (error) {
        console.error('Error playing track:', error);
    }
}

function updateNowPlaying(track) {
    currentTrackImg.src = track.album.images[1].url;
    currentTrackName.textContent = track.name;
    currentTrackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
}

function updatePlaybackState(state) {
    // Update progress bar
    if (state.duration) {
        const percent = (state.position / state.duration) * 100;
        progress.style.width = `${percent}%`;
    }

    // Update play/pause button
    playPauseIcon.className = state.paused ? 'fas fa-play' : 'fas fa-pause';

    // Update track info if changed
    if (state.track_window?.current_track) {
        const track = state.track_window.current_track;
        updateNowPlaying(track);
    }
}

async function playPreviousTrack() {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        await playTrack(currentTracks[currentTrackIndex]);
    }
}

async function playNextTrack() {
    if (currentTrackIndex < currentTracks.length - 1) {
        currentTrackIndex++;
        await playTrack(currentTracks[currentTrackIndex]);
    }
}

// Event Listeners for track selection
getTracksBtn.addEventListener('click', async () => {
    const selectedGenre = genreSelect.value;
    if (!selectedGenre) {
        alert('Please select a genre first');
        return;
    }
    await fetchTracksByGenre(selectedGenre);
});

getArtistTracksBtn.addEventListener('click', async () => {
    const selectedArtist = artistSelect.value;
    if (!selectedArtist) {
        alert('Please select an artist first');
        return;
    }
    await fetchArtistTopTracks(selectedArtist);
});

async function fetchTracksByGenre(genre) {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/recommendations?seed_genres=${genre}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        currentTracks = data.tracks;
        displayTracks(data.tracks);
    } catch (error) {
        console.error('Error fetching tracks:', error);
        tracksList.innerHTML = '<p class="error">Error loading tracks. Please try again.</p>';
    }
}

async function fetchArtistTopTracks(artistId) {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        currentTracks = data.tracks;
        displayTracks(data.tracks);
    } catch (error) {
        console.error('Error fetching artist tracks:', error);
        tracksList.innerHTML = '<p class="error">Error loading tracks. Please try again.</p>';
    }
}

function displayTracks(tracks) {
    if (!tracks || tracks.length === 0) {
        tracksList.innerHTML = '<p>No tracks found</p>';
        return;
    }

    tracksList.innerHTML = tracks.map((track, index) => `
        <div class="track-item" onclick="playTrack(currentTracks[${index}])">
            <img src="${track.album.images[2]?.url || 'placeholder.jpg'}" alt="${track.name}" width="64" height="64">
            <div class="track-info">
                <h4>${index + 1}. ${track.name}</h4>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
            </div>
        </div>
    `).join('');
}

// Add modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: #2d2d2d;
        padding: 2rem;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .genres-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .genre-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
        text-transform: capitalize;
    }

    #artistSearch {
        width: 100%;
        padding: 0.8rem;
        margin: 1rem 0;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 4px;
        color: white;
    }

    .artist-results {
        margin-top: 1rem;
    }

    .artist-result {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 4px;
    }

    .artist-result:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .artist-result img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }
`;
document.head.appendChild(modalStyles); 
