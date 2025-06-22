import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyB7QV468vL_oUh4OvL33cMvZqBnWx80m-w",
    authDomain: "newz-kript.firebaseapp.com",
    projectId: "newz-kript",
    storageBucket: "newz-kript.firebasestorage.app",
    messagingSenderId: "309842816457",
    appId: "1:309842816457:web:11f4aba9d7b8611ea84c18"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);