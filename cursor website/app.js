// DOM Elements
const genresBtn = document.getElementById('genresBtn');
const artistsBtn = document.getElementById('artistsBtn');
const getTracksBtn = document.getElementById('getTracksBtn');
const getArtistTracksBtn = document.getElementById('getArtistTracksBtn');
const tracksList = document.getElementById('tracksList');

let selectedGenre = null;
let selectedArtist = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSpotifyAuth();
});

// Event Listeners
genresBtn.addEventListener('click', async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/recommendations/available-genre-seeds`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        // Create and show genres modal
        showGenresModal(data.genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
});

artistsBtn.addEventListener('click', () => {
    // Create and show artist search modal
    showArtistSearchModal();
});

getTracksBtn.addEventListener('click', async () => {
    if (!selectedGenre) {
        alert('Please select a genre first');
        return;
    }
    await fetchTracksByGenre(selectedGenre);
});

getArtistTracksBtn.addEventListener('click', async () => {
    if (!selectedArtist) {
        alert('Please select an artist first');
        return;
    }
    await fetchArtistTopTracks(selectedArtist);
});

// Helper Functions
function showGenresModal(genres) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Select a Genre</h3>
            <div class="genres-list">
                ${genres.map(genre => `
                    <button class="genre-btn" data-genre="${genre}">
                        ${genre}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add click events to genre buttons
    modal.querySelectorAll('.genre-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedGenre = btn.dataset.genre;
            genresBtn.textContent = selectedGenre;
            document.body.removeChild(modal);
        });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function showArtistSearchModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Search for an Artist</h3>
            <input type="text" id="artistSearch" placeholder="Enter artist name...">
            <div id="artistResults" class="artist-results"></div>
        </div>
    `;

    document.body.appendChild(modal);

    const searchInput = modal.querySelector('#artistSearch');
    const resultsDiv = modal.querySelector('#artistResults');

    let debounceTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            searchArtists(e.target.value, resultsDiv);
        }, 300);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

async function searchArtists(query, resultsDiv) {
    if (!query) return;

    const token = getAccessToken();
    if (!token) return;

    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        resultsDiv.innerHTML = data.artists.items.map(artist => `
            <div class="artist-result" data-artist-id="${artist.id}">
                <img src="${artist.images[2]?.url || 'placeholder.jpg'}" alt="${artist.name}">
                <span>${artist.name}</span>
            </div>
        `).join('');

        // Add click events to artist results
        resultsDiv.querySelectorAll('.artist-result').forEach(result => {
            result.addEventListener('click', () => {
                selectedArtist = result.dataset.artistId;
                artistsBtn.textContent = result.querySelector('span').textContent;
                document.body.removeChild(result.closest('.modal'));
            });
        });
    } catch (error) {
        console.error('Error searching artists:', error);
    }
}

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
        displayTracks(data.tracks);
    } catch (error) {
        console.error('Error fetching tracks:', error);
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
        displayTracks(data.tracks);
    } catch (error) {
        console.error('Error fetching artist tracks:', error);
    }
}

function displayTracks(tracks) {
    tracksList.innerHTML = tracks.map(track => `
        <div class="track-item">
            <img src="${track.album.images[2].url}" alt="${track.name}" width="64" height="64">
            <div class="track-info">
                <h4>${track.name}</h4>
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