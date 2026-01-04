// Hacker News API Configuration
const API_BASE = 'https://hacker-news.firebaseio.com/v0';
const STORY_LIMIT = 30; // Number of stories to display

// DOM Elements
const storiesContainer = document.getElementById('stories');
const loadingIndicator = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');

// Keywords to filter stories (customize these based on your interests!)
const INTEREST_KEYWORDS = [
    'ai', 'machine learning', 'gpt', 'llm', 'claude',
    'javascript', 'python', 'rust', 'go', 'typescript',
    'startup', 'open source', 'github', 'security',
    'web', 'react', 'vue', 'node', 'developer',
    'ask hn', 'show hn'  // Prioritize Ask/Show HN as they have descriptions
];

// Fetch top story IDs
async function fetchTopStories() {
    const response = await fetch(`${API_BASE}/topstories.json`);
    return await response.json();
}

// Fetch individual story details
async function fetchStory(id) {
    const response = await fetch(`${API_BASE}/item/${id}.json`);
    return await response.json();
}

// Check if story matches our interests
function isInteresting(story) {
    if (!story.title) return false;

    const titleLower = story.title.toLowerCase();
    const urlLower = (story.url || '').toLowerCase();

    // Check if any keyword matches
    return INTEREST_KEYWORDS.some(keyword =>
        titleLower.includes(keyword) || urlLower.includes(keyword)
    );
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Strip HTML tags and truncate text
function formatDescription(htmlText, maxLength = 200) {
    if (!htmlText) return '';

    // Strip HTML tags
    const text = htmlText.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const decoded = textarea.value;

    // Truncate if needed
    if (decoded.length > maxLength) {
        return decoded.substring(0, maxLength).trim() + '...';
    }

    return decoded;
}

// Create story card HTML
function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';

    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    const domain = story.url ? new URL(story.url).hostname.replace('www.', '') : 'news.ycombinator.com';
    const description = formatDescription(story.text);

    card.innerHTML = `
        <div class="story-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
                ${story.title}
            </a>
        </div>
        ${description ? `<div class="story-description">${description}</div>` : ''}
        <div class="story-meta">
            <span>⬆️ ${story.score || 0} points</span>
            <span>💬 ${story.descendants || 0} comments</span>
            <span>👤 ${story.by || 'anonymous'}</span>
            <span>⏰ ${formatTime(story.time)}</span>
            <span>🔗 ${domain}</span>
        </div>
        <div class="story-link">
            <a href="https://news.ycombinator.com/item?id=${story.id}" target="_blank" rel="noopener noreferrer">
                View on Hacker News →
            </a>
        </div>
    `;

    return card;
}

// Display error message
function showError(message) {
    storiesContainer.innerHTML = `
        <div class="error">
            ⚠️ ${message}
        </div>
    `;
}

// Main function to load and display stories
async function loadStories() {
    try {
        // Show loading state
        loadingIndicator.classList.add('show');
        refreshBtn.disabled = true;
        storiesContainer.innerHTML = '';

        // Fetch top story IDs
        const storyIds = await fetchTopStories();

        // Fetch stories in batches
        const stories = [];
        let checkedCount = 0;

        for (const id of storyIds) {
            if (stories.length >= STORY_LIMIT) break;
            if (checkedCount >= 100) break; // Don't check more than 100 stories

            checkedCount++;
            const story = await fetchStory(id);

            // Skip deleted or dead stories
            if (!story || story.deleted || story.dead) continue;

            // Add all stories, or filter by interests (comment out the filter to see all)
            if (isInteresting(story) || stories.length < 10) {
                // Always show at least 10 stories even if they don't match perfectly
                stories.push(story);

                // Debug: Log if story has description
                if (story.text) {
                    console.log('Story with description:', story.title, '(length:', story.text.length, ')');
                }
            }
        }

        // Display stories
        if (stories.length === 0) {
            showError('No stories found. Try adjusting your interest keywords in app.js');
        } else {
            // Sort to show stories with descriptions first
            const sortedStories = stories.sort((a, b) => {
                if (a.text && !b.text) return -1;
                if (!a.text && b.text) return 1;
                return 0;
            });

            sortedStories.forEach(story => {
                const card = createStoryCard(story);
                storiesContainer.appendChild(card);
            });
        }

    } catch (error) {
        console.error('Error loading stories:', error);
        showError('Failed to load stories. Please try again.');
    } finally {
        loadingIndicator.classList.remove('show');
        refreshBtn.disabled = false;
    }
}

// Event listeners
refreshBtn.addEventListener('click', loadStories);

// Load stories on page load
loadStories();
