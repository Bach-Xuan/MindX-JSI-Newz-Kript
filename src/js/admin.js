import {
    auth,
    db
} from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import {
    addDoc,
    collection,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

// Make showSection globally accessible
window.showSection = function (sectionId, clickedElement) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update active menu item
    const menuItems = document.querySelectorAll('.sidebar a');
    menuItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');

    // If showing delete section, fetch and display articles
    if (sectionId === 'delete') {
        fetchFirestoreArticles();
    }
}

export function publish() {
    document.getElementById('publish').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!document.getElementById('publish').checkValidity()) {
            document.getElementById('publish').classList.add('was-validated');
            return;
        }
        const article = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            author: document.getElementById('author').value,
            description: document.getElementById('description').value,
            content: document.getElementById('content').value
        };
        try {
            // Add the document to the "article" collection
            const docRef = await addDoc(collection(db, 'articles'), article);
            if (confirm('Article published successfully! Go to homepage?')) {
                window.location.href = '../../index.html';
            }
            else {
                location.reload();
            }
            return docRef.id;
        }
        catch (error) {
            alert('An error occurred while publishing the article. Please try again!');
            console.error(error.code);
            throw error;
        }
    });
}

function update() {
    // Update functionality can be implemented here
}

function logOut() {
    document.getElementById('btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            alert('You have successfully signed out.');
            window.location.href = 'login.html';
        }).catch((error) => {
            alert("An error occurred while signing out. Please try again!");
            console.error(error.code);
        });
    });
}

// Initialize Bootstrap validation
function initBootstrapValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
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
                author: articleData.author,
                category: articleData.category,
                isFirestore: true
            });
        });

        // Display Firestore articles
        displayFirestoreArticles(firestoreArticles);
        return firestoreArticles;

    } catch (error) {
        console.error("Error fetching Firestore articles:", error);
        // Show error message in the articles container
        const articlesContainer = document.querySelector(".non-api-articles");
        if (articlesContainer) {
            articlesContainer.innerHTML = `
                <div style="text-align: center; color: #dc3545; padding: 20px;">
                    <h3>Error loading articles</h3>
                    <p>Unable to fetch articles from database. Please try again later.</p>
                </div>
            `;
        }
        return [];
    }
}

function displayFirestoreArticles(articles) {
    // Find the articles container in the delete section
    const articlesContainer = document.querySelector("#delete .non-api-articles");

    if (!articlesContainer) {
        console.error("Articles container not found");
        return;
    }

    // Clear existing content
    articlesContainer.innerHTML = "";

    if (articles.length === 0) {
        articlesContainer.innerHTML = `
            <div style="text-align: center; color: #6c757d; padding: 40px;">
                <h3>No Articles Found</h3>
                <p>No articles have been published yet. Create your first article to see it here!</p>
            </div>
        `;
        return;
    }

    // Create article elements
    articles.forEach(article => {
        const articleElement = document.createElement("article");
        articleElement.classList.add("non-api");

        // Truncate content for preview (handle cases where content might be undefined)
        const contentPreview = (article.content || '').substring(0, 150);
        const previewText = contentPreview + (article.content && article.content.length > 150 ? '...' : '');

        articleElement.innerHTML = `
            <div class="non-api-content">
                <h3>${article.title || 'Untitled'}</h3>
                <p class="non-api-description">${article.description || 'No description available'}</p>
                <div class="non-api-preview">${previewText || 'No content available'}</div>
                <div class="non-api-actions">
                    <button class="read-more-btn" onclick="viewArticle('${article.id}')">Read More</button>
                    <button class="edit-btn" onclick="editArticle('${article.id}')" style="margin-left: 10px; background: #ffc107; color: #000;">Edit</button>
                    <button class="delete-btn" onclick="deleteArticle('${article.id}')" style="margin-left: 10px; background: #dc3545; color: #fff;">Delete</button>
                </div>
            </div>
        `;

        articlesContainer.appendChild(articleElement);
    });
}

// Global functions for article actions
window.viewArticle = async function (articleId) {
    try {
        // Fetch the specific article from Firestore
        const querySnapshot = await getDocs(collection(db, "articles"));
        let selectedArticle = null;

        querySnapshot.forEach((doc) => {
            if (doc.id === articleId) {
                selectedArticle = {
                    id: doc.id,
                    ...doc.data()
                };
            }
        });

        if (selectedArticle) {
            // Store the complete article data
            localStorage.setItem('selectedArticle', JSON.stringify(selectedArticle));
            window.location.href = 'article.html';
        } else {
            alert('Article not found!');
        }
    } catch (error) {
        console.error('Error fetching article:', error);
        alert('Error loading article. Please try again!');
    }
}

window.editArticle = async function (articleId) {
    try {
        console.log('Editing article:', articleId); // Debug log
        // Fetch the article data
        const docRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const articleData = docSnap.data();
            console.log('Article data:', articleData); // Debug log
            showEditForm(articleId, articleData);
        } else {
            console.log('No such document!'); // Debug log
            alert('Article not found!');
        }
    } catch (error) {
        console.error('Error fetching article for edit:', error);
        alert('Error loading article. Please try again!');
    }
}

window.deleteArticle = async function (articleId) {
    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        try {
            // Show loading state
            const deleteBtn = event.target;
            const originalText = deleteBtn.textContent;
            deleteBtn.textContent = 'Deleting...';
            deleteBtn.disabled = true;

            // Delete the document from Firestore
            await deleteDoc(doc(db, "articles", articleId));

            alert('Article deleted successfully!');

            // Refresh the articles list
            fetchFirestoreArticles();

        } catch (error) {
            console.error('Error deleting article:', error);
            alert('An error occurred while deleting the article. Please try again!');

            // Reset button state on error
            const deleteBtn = event.target;
            deleteBtn.textContent = 'Delete';
            deleteBtn.disabled = false;
        }
    }
}

// Show edit form function
function showEditForm(articleId, articleData) {
    console.log('Showing edit form for:', articleId); // Debug log

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Create or show update section
    let updateSection = document.getElementById('update');
    if (!updateSection) {
        // Create the update section if it doesn't exist
        updateSection = document.createElement('div');
        updateSection.id = 'update';
        updateSection.className = 'section';
        document.querySelector('.main-content').appendChild(updateSection);
    }
    updateSection.classList.add('active');

    // Update active menu item - find the menu item that shows delete section
    const menuItems = document.querySelectorAll('.sidebar a');
    menuItems.forEach(item => item.classList.remove('active'));
    // Find the "UPDATE ARTICLE" menu item
    const updateMenuItem = Array.from(menuItems).find(item =>
        item.textContent.includes('UPDATE ARTICLE')
    );
    if (updateMenuItem) {
        updateMenuItem.classList.add('active');
    }

    // Create edit form HTML
    updateSection.innerHTML = `
        <div class="edit-form-container">
            <div class="edit-header">
                <h1>EDIT ARTICLE</h1>
                <button id="cancel-edit" class="cancel-btn">Cancel</button>
            </div>
            <form id="edit-form" class="needs-validation" novalidate>
                <input type="hidden" id="edit-article-id" value="${articleId}">
                
                <div class="form-group">
                    <h6 style="color: black;">EDIT TITLE</h6>
                    <input type="text" class="form-control" id="edit-title" value="${articleData.title || ''}" required>
                    <div class="invalid-feedback">Please provide a title.</div>
                </div>
                
                <div class="form-group">
                    <h6 style="color: black;">SELECT CATEGORY</h6>
                    <select class="form-select" id="edit-category" required>
                        <option value="">Select one category from the menu</option>
                        <option value="world" ${articleData.category === 'world' ? 'selected' : ''}>WORLD</option>
                        <option value="business" ${articleData.category === 'business' ? 'selected' : ''}>BUSINESS</option>
                        <option value="health" ${articleData.category === 'health' ? 'selected' : ''}>HEALTH</option>
                        <option value="education" ${articleData.category === 'education' ? 'selected' : ''}>EDUCATION</option>
                        <option value="technology" ${articleData.category === 'technology' ? 'selected' : ''}>TECHNOLOGY</option>
                        <option value="science" ${articleData.category === 'science' ? 'selected' : ''}>SCIENCE</option>
                        <option value="sports" ${articleData.category === 'sports' ? 'selected' : ''}>SPORTS</option>
                        <option value="entertainment" ${articleData.category === 'entertainment' ? 'selected' : ''}>ENTERTAINMENT</option>
                    </select>
                    <div class="invalid-feedback">Please select a category.</div>
                </div>
                
                <div class="form-group">
                    <h6 style="color: black;">EDIT AUTHOR</h6>
                    <input type="text" class="form-control" id="edit-author" value="${articleData.author || ''}" required>
                    <div class="invalid-feedback">Please provide an author name.</div>
                </div>
                
                <div class="form-group">
                    <h6 style="color: black;">EDIT DESCRIPTION</h6>
                    <textarea class="form-control" id="edit-description" rows="3">${articleData.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <h6 style="color: black;">EDIT CONTENT</h6>
                    <textarea class="form-control" id="edit-content" rows="10">${articleData.content || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="update-btn">UPDATE ARTICLE</button>
                    <button type="button" id="cancel-edit-2" class="cancel-btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Add event listeners
    setupEditForm();
}

// Setup edit form functionality
function setupEditForm() {
    const editForm = document.getElementById('edit-form');
    const cancelBtns = document.querySelectorAll('#cancel-edit, #cancel-edit-2');

    // Handle form submission
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!editForm.checkValidity()) {
            editForm.classList.add('was-validated');
            return;
        }

        const articleId = document.getElementById('edit-article-id').value;
        const updateBtn = editForm.querySelector('.update-btn');
        const originalText = updateBtn.textContent;

        try {
            // Show loading state
            updateBtn.textContent = 'Updating...';
            updateBtn.disabled = true;

            const updatedArticle = {
                title: document.getElementById('edit-title').value,
                category: document.getElementById('edit-category').value,
                author: document.getElementById('edit-author').value,
                description: document.getElementById('edit-description').value,
                content: document.getElementById('edit-content').value,
                updatedAt: new Date().toISOString()
            };

            // Update the document in Firestore
            await updateDoc(doc(db, 'articles', articleId), updatedArticle);

            alert('Article updated successfully!');

            // Reset form and go back to delete section
            const deleteMenuItem = Array.from(document.querySelectorAll('.sidebar a')).find(item =>
                item.textContent.includes('UPDATE ARTICLE')
            );
            if (deleteMenuItem) {
                showSection('delete', deleteMenuItem);
                fetchFirestoreArticles();
            }

        } catch (error) {
            console.error('Error updating article:', error);
            alert('An error occurred while updating the article. Please try again!');

            // Reset button state
            updateBtn.textContent = originalText;
            updateBtn.disabled = false;
        }
    });

    // Handle cancel buttons
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
                const deleteMenuItem = Array.from(document.querySelectorAll('.sidebar a')).find(item =>
                    item.textContent.includes('UPDATE ARTICLE')
                );
                if (deleteMenuItem) {
                    showSection('delete', deleteMenuItem);
                }
            }
        });
    });

    // Initialize Bootstrap validation
    initBootstrapValidation();
}

document.addEventListener('DOMContentLoaded', () => {
    initBootstrapValidation();
    logOut();
    publish();
    update();

    // Load articles when page loads if delete section is active
    const deleteSection = document.getElementById('delete');
    if (deleteSection && deleteSection.classList.contains('active')) {
        fetchFirestoreArticles();
    }
});