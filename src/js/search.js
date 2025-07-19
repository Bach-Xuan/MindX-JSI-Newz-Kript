// search.js
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

class NewsSearch {
    constructor() {
        this.allArticles = [];
        this.filteredArticles = [];
        this.currentQuery = '';
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadArticles();
        this.setupEventListeners();
        this.handleInitialSearch();
    }

    async loadArticles() {
        try {
            this.showLoading(true);

            // First check for search-specific articles from navbar search
            let stored = localStorage.getItem('articles');
            if (stored) {
                this.allArticles = JSON.parse(stored);
                this.showLoading(false);
                return;
            }

            // Then check for general articles cache
            stored = localStorage.getItem('allArticles');
            if (stored) {
                this.allArticles = JSON.parse(stored);
            }

            // If no cache or cache is empty, fetch fresh data
            if (!this.allArticles.length) {
                const apiUrl = "https://newsdata.io/api/1/latest?apikey=pub_6851165a998287bd633cd273478508dd9fdfe&image=1&language=en&removeduplicate=1&excludecategory=crime,domestic,top,tourism,other";

                try {
                    const res = await fetch(apiUrl);
                    if (res.ok) {
                        const data = await res.json();
                        const apiArticles = data.results || [];
                        this.allArticles = [...this.allArticles, ...apiArticles];
                    }
                } catch (apiError) {
                    console.warn('API fetch failed:', apiError);
                }

                // Also fetch Firestore articles
                try {
                    const snapshot = await getDocs(collection(db, "articles"));
                    const fsArticles = [];
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        fsArticles.push({
                            id: doc.id,
                            title: d.title,
                            description: d.description,
                            content: d.content,
                            isFirestore: true,
                            category: 'custom'
                        });
                    });
                    this.allArticles = [...this.allArticles, ...fsArticles];
                } catch (firestoreError) {
                    console.warn('Firestore fetch failed:', firestoreError);
                }

                // Cache the results
                if (this.allArticles.length > 0) {
                    localStorage.setItem('allArticles', JSON.stringify(this.allArticles));
                }
            }

            this.showLoading(false);
        } catch (err) {
            console.error('Error loading articles:', err);
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(e => {
                this.performSearch(e.target.value);
            }, 300));
            searchInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.performSearch(e.target.value);
            });
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                this.setActiveFilter(e.target);
                this.applyFilter(e.target.dataset.filter);
            });
        });

        document.querySelector('.search-btn')?.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            if (input) {
                this.performSearch(input.value);
            }
        });
    }

    handleInitialSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
            this.currentQuery = query;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
            }
            this.performSearch(query);
        } else {
            // Show all articles if no search query
            this.displayResults(this.allArticles);
        }
    }

    performSearch(query) {
        const trimmedQuery = query.trim();
        this.currentQuery = trimmedQuery.toLowerCase();

        const searchTitle = document.getElementById('searchTitle');
        if (searchTitle) {
            searchTitle.textContent = trimmedQuery ? `Search Results for "${trimmedQuery}"` : 'All Articles';
        }

        if (!this.currentQuery) {
            this.filteredArticles = this.allArticles;
        } else {
            this.filteredArticles = this.allArticles.filter(article => {
                const title = (article.title || '').toLowerCase();
                const description = (article.description || '').toLowerCase();
                const content = (article.content || '').toLowerCase();
                const category = (article.category || '').toLowerCase();

                return title.includes(this.currentQuery) ||
                    description.includes(this.currentQuery) ||
                    content.includes(this.currentQuery) ||
                    category.includes(this.currentQuery);
            });
        }

        this.applyFilter(this.currentFilter);
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        let articlesToShow = this.filteredArticles;

        if (filter !== 'all') {
            articlesToShow = this.filteredArticles.filter(article => {
                const category = (article.category || '').toLowerCase();
                return category === filter || category.includes(filter);
            });
        }

        this.displayResults(articlesToShow);
    }

    displayResults(articles) {
        const resultsContainer = document.getElementById('searchResults');
        const noResultsDiv = document.getElementById('noResults');
        const resultCount = document.getElementById('resultCount');

        if (resultCount) {
            resultCount.textContent = articles.length;
        }

        if (!articles.length) {
            if (resultsContainer) resultsContainer.innerHTML = '';
            if (noResultsDiv) noResultsDiv.style.display = 'block';
            return;
        }

        if (noResultsDiv) noResultsDiv.style.display = 'none';

        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            articles.forEach(article => {
                const listItem = document.createElement('li');
                listItem.className = 'article-item';
                listItem.innerHTML = this.createArticleHTML(article);
                listItem.addEventListener('click', () => this.selectArticle(article));
                resultsContainer.appendChild(listItem);
            });
        }
    }

    createArticleHTML(article) {
        const imageUrl = article.image_url || '../assets/img/placeholder.png';
        const publishDate = article.pubDate ? new Date(article.pubDate).toLocaleDateString() : '';
        const source = article.source_id || 'Unknown';
        const title = article.title || 'Untitled';
        const description = article.description || 'No description available';
        const category = (article.category || 'GENERAL').toUpperCase();

        return `
            <div class="article-image">
                <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='../assets/img/placeholder.png'">
            </div>
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-category">${category}</span>
                    ${publishDate ? `<span class="article-date">${publishDate}</span>` : ''}
                    <span class="article-source">${source}</span>
                </div>
                <h3 class="article-title">${title}</h3>
                <p class="article-description">${description}</p>
                <div class="article-actions">
                    <span class="read-more">Read more <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </div>
        `;
    }

    selectArticle(article) {
        const articleData = {
            ...article,
            id: article.link ? btoa(article.link) : article.id || Date.now().toString()
        };
        localStorage.setItem('selectedArticle', JSON.stringify(articleData));
        window.location.href = 'article.html';
    }

    setActiveFilter(button) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
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

// Initialize the search functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsSearch();
});