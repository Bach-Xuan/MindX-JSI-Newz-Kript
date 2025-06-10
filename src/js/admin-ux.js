import {
    auth,
    db
} from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import {
    addDoc,
    collection
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

// Make showSection globally accessible
window.showSection = function(sectionId, clickedElement) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update active menu item
    const menuItems = document.querySelectorAll('.sidebar a');
    menuItems.forEach(item => item.classList.remove('active'));
    clickedElement.classList.add('active');
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
                window.location.href = 'index.html';
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

document.addEventListener('DOMContentLoaded', () => {
    initBootstrapValidation();
    logOut();
    publish();
});