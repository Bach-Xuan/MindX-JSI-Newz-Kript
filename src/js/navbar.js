/* navbar.js */
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

function handleUser() {
    const loginBtn = document.getElementById('login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    const targetPage = user.email === 'admin1@gmail.com'
                        ? './src/html/admin.html'
                        : './src/html/user.html';
                    window.location.href = targetPage;
                } else {
                    window.location.href = './src/html/login.html';
                }
            });
        });
    }
}

// Shared helper functions
async function fetchNewsArticles(query = '') {
    const baseUrl = 'https://newsdata.io/api/1/latest';
    const params = new URLSearchParams({
        apikey: 'pub_6851165a998287bd633cd273478508dd9fdfe',
        image: '1',
        language: 'en',
        removeduplicate: '1'
    });

    if (query) {
        params.set('q', query);
    }

    try {
        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

function calculateLevenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    let previousRow = Array(len2 + 1).fill(0);
    let currentRow = Array(len2 + 1).fill(0);

    // Initialize first row
    for (let j = 0; j <= len2; j++) {
        previousRow[j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        currentRow[0] = i;

        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            currentRow[j] = Math.min(
                previousRow[j] + 1,     // deletion
                currentRow[j - 1] + 1,  // insertion
                previousRow[j - 1] + cost // substitution
            );
        }

        // Swap rows
        [previousRow, currentRow] = [currentRow, previousRow];
    }

    return previousRow[len2];
}

function getNormalizedDistance(str1, str2) {
    const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length) || 1;
    return 1 - (distance / maxLength);
}

// Main search execution function
async function executeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) return;

    try {
        // Show loading state
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.style.opacity = '0.5';
        }

        // Fetch fresh results for the query
        const apiResults = await fetchNewsArticles(query);
        let searchResults = apiResults;

        // If API returns no results, search in cached articles
        if (!apiResults.length) {
            const cachedArticles = JSON.parse(localStorage.getItem('allArticles') || '[]');
            const queryLower = query.toLowerCase();

            searchResults = cachedArticles.filter(article => {
                const title = (article.title || '').toLowerCase();
                const description = (article.description || '').toLowerCase();
                const content = (article.content || '').toLowerCase();

                return title.includes(queryLower) ||
                    description.includes(queryLower) ||
                    content.includes(queryLower);
            });
        }

        // Store results for the search page
        localStorage.setItem('articles', JSON.stringify(searchResults));

        // Determine the correct path to search results
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/') || currentPath.includes('/src/html/');

        const targetUrl = isInHtmlFolder
            ? `search-results.html?q=${encodeURIComponent(query)}`
            : `src/html/search-results.html?q=${encodeURIComponent(query)}`;

        window.location.href = targetUrl;

    } catch (error) {
        console.error('Search execution error:', error);
        alert('Search failed. Please try again.');
    } finally {
        // Reset loading state
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.style.opacity = '1';
        }
    }
}

// Make executeSearch available globally
window.executeSearch = executeSearch;

// Navbar live search functionality
class NavbarSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.searchBtn = document.querySelector('.search-btn');
        this.allArticles = [];
        this.isLoading = false;
        this.init();
    }

    async init() {
        await this.loadArticles();
        this.setupEventListeners();
    }

    async loadArticles() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            // Check if we have cached articles
            const cachedArticles = localStorage.getItem('allArticles');
            if (cachedArticles) {
                this.allArticles = JSON.parse(cachedArticles);
                this.isLoading = false;
                return;
            }

            // Fetch fresh articles if no cache
            const apiArticles = await fetchNewsArticles();
            this.allArticles = apiArticles;

            // Cache the results
            if (apiArticles.length > 0) {
                localStorage.setItem('allArticles', JSON.stringify(apiArticles));
            }
        } catch (error) {
            console.error('Error loading articles for navbar search:', error);
            this.allArticles = [];
        } finally {
            this.isLoading = false;
        }
    }

    setupEventListeners() {
        if (this.searchInput) {
            // Live search on input
            this.searchInput.addEventListener('input', this.debounce(e => {
                this.showLiveResults(e.target.value);
            }, 200));

            // Execute search on Enter
            this.searchInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearch();
                }
            });

            // Show results on focus if there's a query
            this.searchInput.addEventListener('focus', () => {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.showLiveResults(query);
                }
            });

            // Hide results when clicking outside
            document.addEventListener('click', e => {
                if (!e.target.closest('#searchContainer')) {
                    this.hideResults();
                }
            });
        }

        // Search button click
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', executeSearch);
        }

        // Search icon click (alternative)
        const searchIcon = document.querySelector('.fa-magnifying-glass');
        if (searchIcon) {
            searchIcon.addEventListener('click', executeSearch);
        }

        // Handle user authentication
        handleUser();
    }

    showLiveResults(query) {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery) {
            this.hideResults();
            return;
        }

        // Score and filter articles based on similarity
        const scoredArticles = this.allArticles.map(article => {
            const title = (article.title || '').toLowerCase();
            const description = (article.description || '').toLowerCase();

            // Calculate similarity scores
            const titleScore = getNormalizedDistance(title, trimmedQuery);
            const descScore = getNormalizedDistance(description, trimmedQuery);
            const maxScore = Math.max(titleScore, descScore);

            // Also check for direct substring matches (higher priority)
            const titleMatch = title.includes(trimmedQuery) ? 0.9 : 0;
            const descMatch = description.includes(trimmedQuery) ? 0.7 : 0;
            const directMatch = Math.max(titleMatch, descMatch);

            const finalScore = Math.max(maxScore, directMatch);

            return { article, score: finalScore };
        });

        // Filter and sort by relevance
        const relevantArticles = scoredArticles
            .filter(item => item.score > 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.article);

        this.displayLiveResults(relevantArticles, query);
    }

    displayLiveResults(articles, query) {
        if (!this.resultsContainer) return;

        if (!articles.length) {
            this.resultsContainer.innerHTML = `
                <div class="result-item">
                    <div style="text-align:center;color:#666;padding:20px;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <p>No results found</p>
                        <small>Press Enter to search all articles</small>
                    </div>
                </div>
            `;
        } else {
            // Create result items
            const resultItems = articles.map(article =>
                this.createLiveResultHTML(article, query)
            ).join('');

            // Add "See all results" option
            const seeAllButton = `
                <div class="result-item see-all-results" style="cursor:pointer;border-top:1px solid #eee;">
                    <div style="text-align:center;color:#4a73e8;font-weight:bold;padding:10px;">
                        <i class="fa-solid fa-arrow-right"></i>
                        See all results for "${query}"
                    </div>
                </div>
            `;

            this.resultsContainer.innerHTML = resultItems + seeAllButton;

            // Add click handler for "see all results"
            const seeAllElement = this.resultsContainer.querySelector('.see-all-results');
            if (seeAllElement) {
                seeAllElement.addEventListener('click', executeSearch);
            }
        }

        this.resultsContainer.style.display = 'block';
    }

    createLiveResultHTML(article, query) {
        // Highlight matching terms
        const highlightText = (text) => {
            if (!text) return '';
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        const title = highlightText(article.title || 'Untitled');
        let description = article.description || 'No description available';

        // Truncate description if too long
        if (description.length > 80) {
            description = description.substring(0, 80) + '…';
        }
        const highlightedDescription = highlightText(description);

        // Handle image URL with fallback
        const imageUrl = article.image_url || '../assets/img/placeholder.png';

        return `
            <div class="result-item" style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;">
                <img src="${imageUrl}" 
                     style="width:40px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0;" 
                     onerror="this.src='../assets/img/placeholder.png'"
                     alt="${article.title || 'Article image'}">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:bold;font-size:14px;line-height:1.3;margin-bottom:2px;">${title}</div>
                    <div style="font-size:12px;color:#666;line-height:1.2;">${highlightedDescription}</div>
                </div>
            </div>
        `;
    }

    hideResults() {
        if (this.resultsContainer) {
            this.resultsContainer.style.display = 'none';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize navbar search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavbarSearch();
});