// Dictionary data will be loaded from dictionary.json
let dictionaryData = {};

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const suggestionsBox = document.getElementById('suggestions');
const wordDisplay = document.getElementById('word-display');
const historyList = document.getElementById('history-list');
const themeToggle = document.getElementById('theme-toggle');

// Variables
let searchHistory = JSON.parse(localStorage.getItem('dictionaryHistory')) || [];

// Load dictionary data from JSON file
function loadDictionaryData() {
    return fetch('dictionary.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            dictionaryData = data.words;
            return dictionaryData;
        })
        .catch(error => {
            console.error('Error loading dictionary data:', error);
            // Fallback to a small local dataset if fetch fails
            dictionaryData = {
                "serendipity": {
                    "phonetic": "/ˌsɛrənˈdɪpɪti/",
                    "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/serendipity-us.mp3",
                    "meanings": [{
                        "partOfSpeech": "noun",
                        "definitions": [{
                            "definition": "The occurrence of events by chance in a happy or beneficial way.",
                            "example": "A fortunate stroke of serendipity led to the discovery."
                        }],
                        "synonyms": ["chance", "fortuity", "luck", "fluke"]
                    }]
                },
                "ephemeral": {
                    "phonetic": "/ɪˈfɛm(ə)rəl/",
                    "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3",
                    "meanings": [{
                        "partOfSpeech": "adjective",
                        "definitions": [{
                            "definition": "Lasting for a very short time.",
                            "example": "Fashions are ephemeral, but style is eternal."
                        }],
                        "synonyms": ["transitory", "short-lived", "fleeting", "momentary"]
                    }]
                }
            };
            return dictionaryData;
        });
}

// Initialize the app
async function init() {
    await loadDictionaryData();
    updateHistoryDisplay();
    loadThemePreference();
    
    // Add popular tag event listeners
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            searchInput.value = tag.textContent;
            searchWord();
        });
    });
}

// Search for a word
function searchWord() {
    const word = searchInput.value.trim().toLowerCase();
    
    if (!word) return;
    
    if (dictionaryData[word]) {
        displayWordInfo(word, dictionaryData[word]);
        addToHistory(word);
    } else {
        displayNotFound(word);
    }
    
    suggestionsBox.style.display = 'none';
}

// Display word information
function displayWordInfo(word, data) {
    let html = `
        <div class="word-info">
            <div class="word-header">
                <h2 class="word-title">${word}</h2>
                <button class="audio-btn" onclick="playAudio('${data.audio}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <p class="phonetic">${data.phonetic}</p>
    `;
    
    data.meanings.forEach(meaning => {
        html += `
            <h3 class="part-of-speech">${meaning.partOfSpeech}</h3>
            <div class="definitions">
        `;
        
        meaning.definitions.forEach((def, index) => {
            if (index < 3) { // Limit to 3 definitions per part of speech
                html += `
                    <p class="definition">${def.definition}</p>
                    ${def.example ? `<p class="example">"${def.example}"</p>` : ''}
                `;
            }
        });
        
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            html += `
                <div class="synonyms">
                    <span>Synonyms: </span>
            `;
            
            meaning.synonyms.slice(0, 5).forEach(syn => {
                html += `<span class="synonym-tag" onclick="searchSynonym('${syn}')">${syn}</span>`;
            });
            
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    html += `</div>`;
    wordDisplay.innerHTML = html;
}

// Display not found message
function displayNotFound(word) {
    wordDisplay.innerHTML = `
        <div class="not-found">
            <i class="fas fa-question-circle"></i>
            <h2>Word not found</h2>
            <p>We couldn't find a definition for "${word}".</p>
            <p>Try searching for another word or check the spelling.</p>
        </div>
    `;
}

// Play audio pronunciation
function playAudio(audioUrl) {
    if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.log("Audio play failed:", e));
    }
}

// Search for a synonym
function searchSynonym(synonym) {
    searchInput.value = synonym;
    searchWord();
}

// Show suggestions
function showSuggestions() {
    const input = searchInput.value.trim().toLowerCase();
    
    if (!input) {
        suggestionsBox.style.display = 'none';
        return;
    }
    
    const matches = Object.keys(dictionaryData).filter(word => 
        word.toLowerCase().startsWith(input)
    ).slice(0, 8); // Limit to 8 suggestions
    
    if (matches.length > 0) {
        suggestionsBox.innerHTML = matches.map(word => 
            `<div class="suggestion-item" onclick="selectSuggestion('${word}')">${word}</div>`
        ).join('');
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
}

// Select a suggestion
function selectSuggestion(word) {
    searchInput.value = word;
    searchWord();
}

// Add word to search history
function addToHistory(word) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item !== word);
    // Add to beginning
    searchHistory.unshift(word);
    // Keep only last 10 items
    searchHistory = searchHistory.slice(0, 10);
    
    localStorage.setItem('dictionaryHistory', JSON.stringify(searchHistory));
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    historyList.innerHTML = searchHistory.map(word => 
        `<li class="history-item" onclick="searchFromHistory('${word}')">
            ${word}
            <i class="fas fa-arrow-right"></i>
        </li>`
    ).join('');
    
    if (searchHistory.length === 0) {
        historyList.innerHTML = '<li class="history-empty">No recent searches</li>';
    }
}

// Search from history
function searchFromHistory(word) {
    searchInput.value = word;
    searchWord();
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dictionaryTheme', newTheme);
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('dictionaryTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set correct icon
    const icon = themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Event Listeners
searchBtn.addEventListener('click', searchWord);
searchInput.addEventListener('input', showSuggestions);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWord();
});
themeToggle.addEventListener('click', toggleTheme);

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

// Initialize the app
init();