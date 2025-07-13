import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

document.getElementById('login').addEventListener('click', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (/index\.html|article/.test(location.pathname)) {
                location.href = user.email === 'admin1@gmail.com'
                    ? 'admin.html'
                    : 'user.html';
            }
        } else {
            location.href = 'login.html';
        }
    });
});