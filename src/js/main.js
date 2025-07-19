import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const fsPromise = fetchFirestoreArticles();
    const apiPromise = fetchNewsData();

    try {
        const [apiArticles, fsArticles] = await Promise.all([apiPromise, fsPromise]);
        const all = [...(apiArticles || []), ...(fsArticles || [])];
        localStorage.setItem('allArticles', JSON.stringify(all));
    } catch (err) {
        console.error('Error merging articles:', err);
    }
}

// ─── 1) Fetch & Render External News API ──────────────────────────────────────
async function fetchNewsData() {
    const apiUrl =
        'https://newsdata.io/api/1/latest?apikey=pub_6851165a998287bd633cd273478508dd9fdfe&image=1&language=en&removeduplicate=1&excludecategory=top';

    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const results = data.results || [];

        if (!results.length) {
            hideApiSections();
            return [];
        }

        renderTopStories(results);
        renderLatestNews(results);
        renderCategories(results);

        return results;
    } catch (error) {
        console.error('Error fetching news API:', error);
        hideApiSections();
        return [];
    }
}

function hideApiSections() {
    ['.top-stories', '.latest-news', '.categories'].forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.style.display = 'none';
    });
}

function renderTopStories(results) {
    const container = document.querySelector('.top-stories');
    if (!container) {
        console.warn('renderTopStories: .top-stories container not found');
        return;
    }
    container.innerHTML = '';

    results.slice(0, 2).forEach((article) => {
        const el = document.createElement('article');
        el.className = 'top-story';
        el.innerHTML = `
      <img src="${article.image_url || './image/800x400.png'}" loading="lazy">
      <div class="top-story-content">
        <h3 style="font-family: 'Noto Serif Display', serif;">${article.title}</h3>
        <p style="font-family: 'Noto Serif', serif;">${article.description}</p>
      </div>`;
        el.onclick = () => selectAndGo(article);
        container.appendChild(el);
    });
}

function renderLatestNews(results) {
    const container = document.querySelector('.latest-news');
    if (!container) {
        console.warn('renderLatestNews: .latest-news container not found');
        return;
    }
    container.innerHTML = '';

    results.slice(2, 5).forEach((article) => {
        const item = document.createElement('div');
        item.className = 'latest-news-item';
        item.innerHTML = `
      <img src="${article.image_url || './image/150x100.png'}" loading="lazy">
      <div><h4 style="font-family: 'Noto Serif Display', serif;">${article.title}</h4>
      <p style="font-family: 'Noto Serif', serif;">${article.description}</p></div>`;
        item.onclick = () => selectAndGo(article);
        container.appendChild(item);
    });
}

function renderCategories(results) {
    const container = document.querySelector('.categories .category');
    if (!container) {
        console.warn('renderCategories: .categories .category container not found');
        return;
    }
    container.innerHTML = '';

    results.slice(5, 11).forEach((article) => {
        const cat = document.createElement('article');
        cat.className = 'category-item';
        cat.innerHTML = `
      <img src="${article.image_url || './image/400x200.png'}" loading="lazy">
      <h4 style="font-family: 'Noto Serif Display', serif;">${article.category}</h4>
      <p style="font-family: 'Noto Serif', serif;">${article.description}</p>`;
        cat.onclick = () => selectAndGo(article);
        container.appendChild(cat);
    });
}

// ─── 2) Fetch & Render Firestore Articles ────────────────────────────────────
async function fetchFirestoreArticles() {
    try {
        const snapshot = await getDocs(collection(db, 'articles'));
        const articles = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            articles.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                content: data.content,
                isFirestore: true,
            });
        });

        displayFirestoreArticles(articles);
        return articles;
    } catch (error) {
        console.error('Error fetching Firestore:', error);
        return [];
    }
}

function displayFirestoreArticles(articles) {
    const top = document.querySelector('.top-stories');
    if (!top) return;
    const parent = top.parentNode;

    let section = document.querySelector('.non-api-section');
    if (!section) {
        section = document.createElement('section');
        section.className = 'non-api-section';
        section.innerHTML = `
      <div class="non-api-articles"></div>`;

        parent.insertBefore(section, top.nextSibling);
    }

    const container = section.querySelector('.non-api-articles');
    if (!container) return;
    container.innerHTML = '';

    articles.forEach((article) => {
        const el = document.createElement('article');
        el.className = 'non-api';
        el.innerHTML = `
      <div class="non-api-content">
        <h3 style="font-family: 'Noto Serif Display', serif;">${article.title}</h3>
        <p class="non-api-description" style="font-family: 'Noto Serif', serif;">${article.description}</p>
        <div class="non-api-preview">${article.content.slice(0, 150)}…</div>
      </div>`;
        el.onclick = () => selectAndGo(article);
        container.appendChild(el);
    });
}

// ─── Utility: save + navigate ─────────────────────────────────────────────────
function selectAndGo(article) {
    const stored = {
        ...article,
        id: article.link ? btoa(article.link) : article.id || '',
    };
    localStorage.setItem('selectedArticle', JSON.stringify(stored));
    location.href = 'src/html/article.html';
}