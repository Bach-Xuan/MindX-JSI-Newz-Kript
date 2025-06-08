import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

async function fetchNewsData() {
    const apiUrl = "https://newsdata.io/api/1/latest?apikey=pub_6851165a998287bd633cd273478508dd9fdfe&category=politics&country=au&language=en";

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const topStories = document.querySelector(".top-stories");
        const latestNews = document.querySelector(".latest-news");
        const categories = document.querySelector(".categories .category");

        // Clear existing content
        topStories.innerHTML = "";
        latestNews.innerHTML = "";
        categories.innerHTML = "";

        // Populate top stories
        data.results.slice(0, 2).forEach(article => {
            const articleElement = document.createElement("article");
            articleElement.classList.add("top-story");
            articleElement.innerHTML = `
                <img src="${article.image_url || './image/800x400.png'}" loading="lazy">
                <div class="top-story-content">
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                </div>
            `;
            articleElement.onclick = () => {
                localStorage.setItem('selectedArticle', JSON.stringify(article));
                location.href = 'article.html';
            };
            topStories.appendChild(articleElement);
        });

        // Populate latest news
        data.results.slice(2, 5).forEach(article => {
            const newsItem = document.createElement("div");
            newsItem.classList.add("latest-news-item");
            newsItem.innerHTML = `
                <img src="${article.image_url || './image/150x100.png'}" loading="lazy">
                <div>
                    <h4>${article.title}</h4>
                    <p>${article.description}</p>
                </div>
            `;
            newsItem.onclick = () => {
                localStorage.setItem('selectedArticle', JSON.stringify(article));
                location.href = 'article.html';
            };
            latestNews.appendChild(newsItem);
        });

        // Populate categories
        data.results.slice(5, 11).forEach(article => {
            const categoryItem = document.createElement("article");
            categoryItem.classList.add("category-item");
            categoryItem.innerHTML = `
                <img src="${article.image_url || './image/400x200.png'}" loading="lazy">
                <h4>${article.category}</h4>
                <p>${article.description}</p>
            `;
            categoryItem.onclick = () => {
                localStorage.setItem('selectedArticle', JSON.stringify(article));
                location.href = 'article.html';
            };
            categories.appendChild(categoryItem);
        });

        // Fetch and display Firestore articles
        await fetchFirestoreArticles();

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function fetchFirestoreArticles() {
    try {
        const querySnapshot = await getDocs(collection(db, "articles"));
        const firestoreArticles = [];

        querySnapshot.forEach((doc) => {
            const articleData = doc.data();
            firestoreArticles.push({
                id: doc.id,
                title: articleData.title,
                description: articleData.description,
                content: articleData.content,
                isFirestore: true // Flag to identify Firestore articles
            });
        });

        // Display Firestore articles in a separate section
        displayFirestoreArticles(firestoreArticles);

    } catch (error) {
        console.error("Error fetching Firestore articles:", error);
    }
}

function displayFirestoreArticles(articles) {
    // Create or find the non-api articles section
    let nonApiSection = document.querySelector(".non-api-section");

    if (!nonApiSection) {
        // Create the section if it doesn't exist
        nonApiSection = document.createElement("section");
        nonApiSection.classList.add("non-api-section");
        nonApiSection.innerHTML = `
            <div class="content-container">
                <h2 class="section-title">Featured Articles</h2>
                <div class="non-api-articles"></div>
            </div>
        `;

        // Insert after the categories section
        const categoriesSection = document.querySelector(".categories");
        if (categoriesSection) {
            categoriesSection.parentNode.insertBefore(nonApiSection, categoriesSection.nextSibling);
        } else {
            document.body.appendChild(nonApiSection);
        }
    }

    const articlesContainer = nonApiSection.querySelector(".non-api-articles");
    articlesContainer.innerHTML = ""; // Clear existing content

    articles.forEach(article => {
        const articleElement = document.createElement("article");
        articleElement.classList.add("non-api");
        articleElement.innerHTML = `
            <div class="non-api-content">
                <h3>${article.title}</h3>
                <p class="non-api-description">${article.description}</p>
                <div class="non-api-preview">${article.content.substring(0, 150)}...</div>
                <div class="non-api-actions">
                    <button class="read-more-btn">Read More</button>
                </div>
            </div>
        `;

        articleElement.onclick = () => {
            localStorage.setItem('selectedArticle', JSON.stringify(article));
            location.href = 'article.html';
        };

        articlesContainer.appendChild(articleElement);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', fetchNewsData);