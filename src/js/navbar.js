import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

function handleUser() {
    document.getElementById('login').addEventListener('click', () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                if (/index\.html|article/.test(location.pathname)) {
                    location.href = user.email === 'admin1@gmail.com'
                        ? './src/html/admin.html'
                        : './src/html/user.html';
                }
            } else {
                location.href = './src/html/login.html';
            }
        });
    });
}



async function fetchNewsArticles(query) {
    try {
        const url = `https://newsdata.io/api/1/latest?apikey=pub_6851165a998287bd633cd273478508dd9fdfe&image=1&language=en&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

function renderArticles(articles) {
    const articleList = document.getElementById('articleList');
    if (!articleList) return;

    if (articles.length === 0) {
        articleList.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    const uniqueArticles = [];
    const titles = new Set();

    articles.forEach(article => {
        if (!titles.has(article.title)) {
            titles.add(article.title);
            uniqueArticles.push(article);
        }
    });

    articleList.innerHTML = uniqueArticles.map((article, index) => {
        const description = article.description || 'No description available';
        const truncatedDescription = description.length > 100 ? description.substring(0, 100) + '...' : description;

        return `
              <li class="article-item">
                  <a href="article.html" onclick="saveArticleToLocalStorage(${index})">
                      <img src="${article.image_url || 'default-image.jpg'}" alt="${article.title}">
                      <div class="article-content">
                          <div class="article-title">${article.title}</div>
                          <div class="article-description">${truncatedDescription}</div>
                          <div class="article-meta">By ${article.creator ? article.creator.join(', ') : 'Unknown'} on ${new Date(article.pubDate).toLocaleDateString()}</div>
                      </div>
                  </a>
              </li>
          `;
    }).join('');

    // Save all articles to localStorage for reference
    localStorage.setItem('articles', JSON.stringify(uniqueArticles));
}

function saveArticleToLocalStorage(index) {
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const selectedArticle = articles[index];
    localStorage.setItem('selectedArticle', JSON.stringify(selectedArticle));
}
// Expose to global scope for HTML onclick usage
window.saveArticleToLocalStorage = saveArticleToLocalStorage;

function viewArticle(article) {
    localStorage.setItem('selectedArticle', JSON.stringify(article));
    window.location.href = 'article.html';
}
// Expose to global scope if needed elsewhere
window.viewArticle = viewArticle;

async function executeSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const query = searchInput.value.trim();
    if (!query) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = "";
        return;
    }
    // Always fetch from API for fresh results
    const articles = await fetchNewsArticles(query);
    localStorage.setItem('articles', JSON.stringify(articles));
    // Also filter allArticles for fallback
    const allArticles = JSON.parse(localStorage.getItem('allArticles') || '[]');
    const filtered = allArticles.filter(a =>
        (a.title && a.title.toLowerCase().includes(query.toLowerCase())) ||
        (a.description && a.description.toLowerCase().includes(query.toLowerCase())) ||
        (a.content && a.content.toLowerCase().includes(query.toLowerCase()))
    );
    localStorage.setItem('fallbackArticles', JSON.stringify(filtered));
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
}

function initializeSearchResultsPage() {
    if (window.location.pathname.endsWith('search-results.html')) {
        const articles = JSON.parse(localStorage.getItem('articles') || '[]');
        renderArticles(articles);
    }
}

document.addEventListener('DOMContentLoaded', initializeSearchResultsPage);

function calculateLevenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array(n + 1).fill(0),
        curr = Array(n + 1).fill(0);

    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

function getNormalizedDistance(a, b) {
    const lowerItem = item.toLowerCase(),
        lowerQuery = query.toLowerCase();
    return lowerItem.includes(lowerQuery) || getNormalizedDistance(lowerItem, lowerQuery) < threshold;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');

    if (searchInput && resultsContainer) {
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value.trim()) searchInput.value = "";
            resultsContainer.style.display = 'none';
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSearch();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    handleUser();
});
