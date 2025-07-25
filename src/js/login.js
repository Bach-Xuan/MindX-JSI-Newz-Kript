import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

function initBootstrapValidation(s = '.needs-validation', f = '.form-control') {
    document.querySelectorAll(`${s} ${f}`).forEach(input => {
        ['input', 'blur'].forEach(ev =>
            input.addEventListener(ev, () => {
                input.classList.remove('is-valid', 'is-invalid');
                if (input.value) {
                    input.classList.add(input.checkValidity() ? 'is-valid' : 'is-invalid');
                }
            })
        );
    });
}

function togglePasswordVisibility() {
    document.getElementById('pwd').addEventListener('input', (e) => {
        document.getElementById('eye').style.display =
            e.target.value.length > 0 ? 'block' : 'none';
    });
    document.getElementById('eye').addEventListener('click', () => {
        document.getElementById('pwd').type = document.getElementById('pwd').type === 'password' ? 'text' : 'password';
        eye.innerHTML = document.getElementById('pwd').innerHTML =
            `<img src="../assets/svg/eye${pwd.type === 'text' ? '-slash' : ''}.svg">`;
    });
}

function login() {
    document.getElementById('login').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!document.getElementById('login').checkValidity()) {
            document.getElementById('login').classList.add('was-validated');
            return;
        }
        const email = document.getElementById('email').value,
            password = document.getElementById('pwd').value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert(`Welcome back, ${userCredential.user.displayName}!`);
                window.location.href = '../../index.html';
            })
            .catch((error) => {
                alert(error.code === 'auth/invalid-credential'
                    ? 'Incorrect email address or password. Please try again!'
                    : `Oops, something went wrong. Please try again later!
                    ${error.code}`);
                console.error(error.code);
            });
    });
}

function continueWithGoogle() {
    document.getElementById('google').addEventListener('click', () => {
        signInWithPopup(auth, new GoogleAuthProvider())
            .then((result) => {
                const isNew = result._tokenResponse?.isNew || false;
                const msg = isNew
                    ? `Welcome to Newz Kript, ${result.user.displayName}!`
                    : `Welcome back, ${result.user.displayName}!`;
                if (document.hasFocus()) {
                    alert(msg);
                    window.location.href = '../../index.html';
                } else {
                    window.addEventListener('focus', () => {
                        alert(msg);
                        window.location.href = '../../index.html';
                    }, { once: true });
                }
            }).catch((error) => {
                if (error.code === 'auth/popup-closed-by-user') return;
                if (error.code === 'auth/popup-blocked') {
                    alert('Popup blocked! Please allow popups for this page and try again.');
                } else {
                    alert(error.code === 'auth/account-exists-with-different-credential'
                        ? `${error.customData.email} has already been used to sign up with a password. Please login!`
                        : `Oops, something went wrong. Please try again later!
                        ${error.code}`);
                }
                console.error(error.code);
            });
    })
}

function continueWithGithub() {
    document.getElementById('github').addEventListener('click', () => {
        signInWithPopup(auth, new GithubAuthProvider())
            .then((result) => {
                const isNew = result._tokenResponse?.isNew || false;
                const msg = isNew
                    ? `Welcome to Newz Kript, ${result.user.displayName}!`
                    : `Welcome back, ${result.user.displayName}!`;
                if (document.hasFocus()) {
                    alert(msg);
                    window.location.href = '../../index.html';
                } else {
                    window.addEventListener('focus', () => {
                        alert(msg);
                        window.location.href = '../../index.html';
                    }, { once: true });
                }
            }).catch((error) => {
                if (error.code === 'auth/popup-closed-by-user') return;
                if (error.code === 'auth/popup-blocked') {
                    alert('Popup blocked! Please allow popups for this page and try again.');
                } else {
                    alert(error.code === 'auth/account-exists-with-different-credential'
                        ? `${error.customData.email} has already been used to sign up with a password. Please login!`
                        : `Oops, something went wrong. Please try again later!
                        ${error.code}`);
                }
                console.error(error.code);
            });
    })
}

document.addEventListener('DOMContentLoaded', () => {
    initBootstrapValidation();
    togglePasswordVisibility();
    login();
    continueWithGoogle();
    continueWithGithub();
});