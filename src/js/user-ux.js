import { auth } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

function signOut() {
    document.getElementById('signOut').addEventListener('click', () => {
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
    signOut();
});