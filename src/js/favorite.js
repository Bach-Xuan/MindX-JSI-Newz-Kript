// favorite.js - Complete Firestore implementation
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import {
  doc, setDoc, deleteDoc, getDoc,
  collection, onSnapshot, orderBy, query
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

// Initialize favorite functionality
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Handle unauthenticated user
    const favBtn = document.getElementById('favBtn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        alert('Please login first to save favorites!');
      });
    }
    return;
  }

  const uid = user.uid;

  // ARTICLE PAGE MODE - Handle individual article favorite functionality
  const favBtn = document.getElementById('favBtn');
  if (favBtn) {
    // Get article ID from URL parameters or generate from article data
    const articleId = getArticleId();
    if (articleId) {
      const favRef = doc(db, 'users', uid, 'favorites', articleId);

      // Function to update visual state with animation
      async function setFavState(isFav) {
        favBtn.classList.toggle('fav-btn--active', isFav);

        // Update icon
        const icon = favBtn.querySelector('i');
        if (icon) {
          icon.className = isFav ? 'fas fa-star' : 'far fa-star';
        }

        // Update title attribute
        favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';

        // Trigger animation
        favBtn.classList.add('toggle-effect');
        setTimeout(() => favBtn.classList.remove('toggle-effect'), 600);
      }

      // Initialize favorite state on page load
      async function initFavoriteState() {
        try {
          const snap = await getDoc(favRef);
          setFavState(snap.exists());
        } catch (error) {
          console.error('Error checking favorite status:', error);
          setFavState(false);
        }
      }

      // Handle favorite button click
      favBtn.addEventListener('click', async () => {
        try {
          // Add loading state
          favBtn.disabled = true;
          favBtn.style.opacity = '0.6';

          const snap = await getDoc(favRef);

          if (snap.exists()) {
            // Remove from favorites
            await deleteDoc(favRef);
            setFavState(false);
            showToast('Removed from favorites', 'success');
          } else {
            // Add to favorites
            const articleData = getCurrentArticleData();
            await setDoc(favRef, {
              ...articleData,
              addedAt: new Date()
            });
            setFavState(true);
            showToast('Added to favorites', 'success');
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          showToast('Error updating favorites', 'error');
        } finally {
          // Remove loading state
          favBtn.disabled = false;
          favBtn.style.opacity = '1';
        }
      });

      // Initialize on page load
      initFavoriteState();

      // Refresh when returning to page (browser back button)
      window.addEventListener('pageshow', initFavoriteState);
    }
  }

  // FAVORITES LIST PAGE MODE - Handle favorites list display
  const favList = document.getElementById('favoritesList');
  if (favList) {
    console.log('[DEBUG] Found favorites list, initializing list page mode');

    const favCol = collection(db, 'users', uid, 'favorites');
    const q = query(favCol, orderBy('addedAt', 'desc'));

    onSnapshot(q, (snapshot) => {
      console.log('[DEBUG] Favorites snapshot size:', snapshot.size);

      favList.innerHTML = '';

      if (snapshot.empty) {
        favList.innerHTML = '<li class="list-group-item text-center">No favorites yet. Start saving articles!</li>';
        return;
      }

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';

        const timeAgo = getTimeAgo(data.addedAt?.toDate() || new Date());

        li.innerHTML = `
          <div class="favorite-item-content">
            <a href="article.html?id=${docSnap.id}" class="favorite-title">${data.title}</a>
            <small class="text-muted d-block">Added ${timeAgo}</small>
            ${data.author ? `<small class="text-muted d-block">${data.author}</small>` : ''}
          </div>
          <button class="btn btn-sm btn-outline-danger remove-btn" title="Remove from favorites">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;

        // Add remove functionality
        li.querySelector('.remove-btn').addEventListener('click', async () => {
          try {
            await deleteDoc(doc(db, 'users', uid, 'favorites', docSnap.id));
            showToast('Removed from favorites', 'success');
          } catch (error) {
            console.error('Error removing favorite:', error);
            showToast('Error removing favorite', 'error');
          }
        });

        favList.appendChild(li);
      });
    }, (error) => {
      console.error('Error listening to favorites:', error);
      favList.innerHTML = '<li class="list-group-item text-center text-danger">Error loading favorites</li>';
    });
  }
});

// Helper function to get article ID
function getArticleId() {
  // Try URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  let articleId = urlParams.get('id');

  if (articleId) {
    return articleId;
  }

  // Try to get from localStorage
  const storedArticle = localStorage.getItem('selectedArticle');
  if (storedArticle) {
    try {
      const article = JSON.parse(storedArticle);
      if (article.id) {
        return article.id;
      }
      // Generate ID from title if no ID exists
      if (article.title) {
        return generateIdFromTitle(article.title);
      }
    } catch (error) {
      console.error('Error parsing stored article:', error);
    }
  }

  // Fallback: generate from current page title
  const title = document.getElementById('article-title')?.textContent || document.title;
  return generateIdFromTitle(title);
}

// Helper function to generate ID from title
function generateIdFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Helper function to get current article data
function getCurrentArticleData() {
  const title = document.getElementById('article-title')?.textContent || 'Untitled';
  const author = document.getElementById('article-author')?.textContent || 'Unknown Author';
  const image = document.getElementById('article-image')?.src || '';
  const description = document.getElementById('article-description')?.textContent || '';
  const link = document.getElementById('article-link')?.href || window.location.href;

  return {
    title,
    author,
    image_url: image,
    description,
    link,
    url: window.location.href
  };
}

// Helper function to show toast notifications
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;

  // Add styles
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  // Set background color based on type
  if (type === 'success') {
    toast.style.backgroundColor = '#28a745';
  } else if (type === 'error') {
    toast.style.backgroundColor = '#dc3545';
  } else {
    toast.style.backgroundColor = '#007bff';
  }

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Helper function to get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
}