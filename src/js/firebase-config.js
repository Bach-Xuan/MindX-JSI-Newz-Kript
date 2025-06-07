import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyAU6KTEdSDBTHaT0WcW1VsZHnm6I9WJghI",
    authDomain: "news-script-4462d.firebaseapp.com",
    projectId: "news-script-4462d",
    storageBucket: "news-script-4462d.firebasestorage.app",
    messagingSenderId: "1061104728483",
    appId: "1:1061104728483:web:effcc68c684147631dc216",
    measurementId: "G-H3YQG889CW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log(app.name);