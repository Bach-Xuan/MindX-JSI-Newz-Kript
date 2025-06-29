import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import {
  doc, setDoc, deleteDoc, getDoc,
  collection, onSnapshot, orderBy, query
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

onAuthStateChanged(auth, user => {
  if (!user) return; // require login

  const uid = user.uid;
  const article = JSON.parse(localStorage.getItem('selectedArticle'));
  const articleId = article?.id;
  const favBtn = document.getElementById('favBtn');

  // ----- Article page mode -----
  if (articleId && favBtn) {
    const favRef = doc(db, 'users', uid, 'favorites', articleId);

    // initialize button state
    getDoc(favRef).then(snap => {
      toggleButton(snap.exists());
    });

    favBtn.addEventListener('click', async () => {
      const exists = (await getDoc(favRef)).exists();
      if (exists) {
        await deleteDoc(favRef);
        toggleButton(false);
      } else {
        // grab title from DOM
        const title = document.getElementById('article-title').textContent;
        await setDoc(favRef, { title, addedAt: new Date() });
        toggleButton(true);
      }
    });
  }

  // ----- User page mode -----
  const favList = document.getElementById('favoritesList');
  if (favList) {
    const favCol = collection(db, 'users', uid, 'favorites');
    const q = query(favCol, orderBy('addedAt', 'desc'));
    onSnapshot(q, snap => {
      favList.innerHTML = '';
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
          <a href="article.html?id=${docSnap.id}">${data.title}</a>
          <button class="btn btn-sm btn-outline-danger remove-btn">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;
        // remove handler
        li.querySelector('.remove-btn').onclick = () => deleteDoc(doc(db, 'users', uid, 'favorites', docSnap.id));
        favList.appendChild(li);
      });
      if (snap.empty) {
        favList.innerHTML = '<li class="list-group-item">No favorites yet.</li>';
      }
    });
  }
});

function toggleButton(isFav) {
  const btn = document.getElementById('favBtn');
  if (!btn) return;
  btn.classList.toggle('fav-btn--active', isFav);
  btn.innerHTML = isFav
    ? '<i class="fas fa-star"></i> Remove Favorite'
    : '<i class="far fa-star"></i> Add to Favorites';
}