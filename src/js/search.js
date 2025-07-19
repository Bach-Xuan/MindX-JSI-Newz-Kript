// search.js
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

class NewsSearch {
    constructor() {
        this.allArticles = [];
        this.filteredArticles = [];
        this.currentQuery = '';
        this.currentFilter = 'all';
        this.isLoading = false;
        this.init();
    }

    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startInitialization());
        } else {
            this.startInitialization();
        }
    }

    async startInitialization() {
        try {
            await this.loadArticles();
            this.setupEventListeners();
            this.handleInitialSearch();
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showError('Failed to initialize search. Please refresh the page.');
        }
    }

    async loadArticles() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            this.showLoading(true);
            const stored = localStorage.getItem('articles');
            if (stored) {
                try {
                    this.allArticles = JSON.parse(stored);
                    localStorage.removeItem('articles');
                    this.showLoading(false);
                    this.isLoading = false;
                    return;
                } catch { }
            }

            const cached = localStorage.getItem('allArticles');
            if (cached) {
                try { this.allArticles = JSON.parse(cached); } catch { this.allArticles = []; }
            }

            if (!this.allArticles.length) await this.fetchFreshArticles();
            this.showLoading(false);
        } catch {
            this.showError('Failed to load articles. Please try again.');
        } finally {
            this.isLoading = false;
        }
    }

    async fetchFreshArticles() {
        const articles = [];
        try {
            const url = 'https://newsdata.io/api/1/latest?apikey=pub_6851165a998287bd633cd273478508dd9fdfe&image=1&language=en&removeduplicate=1';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.results)) articles.push(...data.results);
            }
        } catch { }

        try {
            const snapshot = await getDocs(collection(db, 'articles'));
            snapshot.forEach(doc => {
                const d = doc.data();
                articles.push({
                    id: doc.id,
                    title: d.title,
                    description: d.description,
                    content: d.content,
                    image_url: d.image_url || null,
                    category: d.category || 'general',
                    source_id: 'Custom',
                    pubDate: d.pubDate || new Date().toISOString(),
                    isFirestore: true
                });
            });
        } catch { }

        this.allArticles = articles;
        if (articles.length) localStorage.setItem('allArticles', JSON.stringify(articles));
    }

    setupEventListeners() {
        const input = document.getElementById('searchInput');
        if (input) {
            const clone = input.cloneNode(true);
            input.parentNode.replaceChild(clone, input);
            clone.addEventListener('input', this.debounce(e => this.performSearch(e.target.value), 300));
            clone.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); this.performSearch(clone.value); } });
        }

        const btn = document.querySelector('.search-btn');
        if (btn) btn.addEventListener('click', e => { e.preventDefault(); this.performSearch(document.getElementById('searchInput').value); });

        document.querySelectorAll('.filter-btn').forEach(b =>
            b.addEventListener('click', e => { e.preventDefault(); this.setActiveFilter(b); this.applyFilter(b.dataset.filter); })
        );
    }

    handleInitialSearch() {
        const q = new URLSearchParams(window.location.search).get('q');
        if (q) {
            this.currentQuery = q.toLowerCase();
            const inp = document.getElementById('searchInput'); if (inp) inp.value = q;
            this.performSearch(q);
        } else {
            this.filteredArticles = this.allArticles;
            this.displayResults(this.allArticles);
        }
    }

    performSearch(query) {
        const tq = (query || '').trim().toLowerCase();
        this.currentQuery = tq;
        const titleEl = document.getElementById('searchTitle');
        if (titleEl) titleEl.textContent = tq ? `Search Results for "${tq}"` : 'All Articles';

        this.filteredArticles = !tq
            ? [...this.allArticles]
            : this.allArticles.filter(a => {
                const norm = x => {
                    if (Array.isArray(x)) x = x.join(', ');
                    return String(x || '').toLowerCase();
                };
                const fields = [a.title, a.description, a.content, a.source_id, a.category].map(norm);
                return fields.some(f => f.includes(tq));
            });
        this.applyFilter(this.currentFilter);
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        let toShow = [...this.filteredArticles];
        if (filter && filter !== 'all') {
            toShow = toShow.filter(a => {
                let c = a.category;
                if (Array.isArray(c)) c = c.join(', ');
                return String(c || '').toLowerCase().includes(filter);
            });
        }
        this.displayResults(toShow);
    }

    displayResults(list) {
        const wrap = document.getElementById('searchResults');
        const none = document.getElementById('noResults');
        const count = document.getElementById('resultCount');
        if (count) count.textContent = list.length;
        if (!wrap) return;

        if (!list.length) {
            wrap.innerHTML = '';
            if (none) none.style.display = 'block';
            return;
        }
        if (none) none.style.display = 'none';

        wrap.innerHTML = '';
        list.forEach(item => {
            const li = document.createElement('li'); li.className = 'article-item';
            li.innerHTML = this.createArticleHTML(item);
            li.addEventListener('click', () => this.selectArticle(item));
            wrap.appendChild(li);
        });
    }

    createArticleHTML(article) {
        const normalize = x => {
            if (Array.isArray(x)) x = x.join(', ');
            return String(x || '');
        };
        const title = normalize(article.title);
        const desc = normalize(article.description);
        const cont = normalize(article.content);
        const src = normalize(article.source_id);
        const pub = article.pubDate ? new Date(article.pubDate).toLocaleDateString() : '';
        let cat = normalize(article.category).toUpperCase();

        return `
            <div class="article-image">
                <img src="${article.image_url || '../assets/img/placeholder.png'}" alt="${title}" loading="lazy" onerror="this.src='../assets/img/placeholder.png'">
            </div>
            <div class="article-content">
                <div class="article-meta">
                    ${pub ? `<span class="article-date">${pub}</span>` : ''}
                    <span class="article-source">${src}</span>
                </div>
                <h3 class="article-title">${title}</h3>
                <p class="article-description">${desc}</p>
                <div class="article-actions">
                    <span class="read-more">Read more <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </div>`;
    }

    selectArticle(article) {
        try {
            const data = { ...article, id: article.link ? btoa(article.link) : (article.id || Date.now().toString()) };
            localStorage.setItem('selectedArticle', JSON.stringify(data));
            window.location.href = 'article.html';
        } catch (e) { console.error(e); }
    }

    setActiveFilter(btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    showLoading(v) { const s = document.getElementById('loadingSpinner'); if (s) s.style.display = v ? 'block' : 'none'; }
    showError(msg) { const c = document.getElementById('searchResults'); if (c) c.innerHTML = `<div class="error">${msg}</div>`; const n = document.getElementById('noResults'); if (n) n.style.display = 'none'; }
    debounce(f, w) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), w); }; }
}

document.addEventListener('DOMContentLoaded', () => new NewsSearch());