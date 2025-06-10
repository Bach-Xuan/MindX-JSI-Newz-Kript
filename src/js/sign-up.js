import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

function initBootstrapValidation(s = '.needs-validation', f = '.form-control') {
    const pwd1 = document.getElementById('pwd1');
    const pwd2 = document.getElementById('pwd2');
    document.querySelectorAll(`${s} ${f}`).forEach(input => {
        ['input', 'blur'].forEach(ev => {
            input.addEventListener(ev, () => {
                input.classList.remove('is-valid', 'is-invalid');
                if (input.value) {
                    input.classList.add(input.checkValidity() ? 'is-valid' : 'is-invalid');
                }
                if ((input === pwd1 || input === pwd2) && pwd1.value && pwd2.value) {
                    pwd2.classList.remove('is-valid', 'is-invalid');
                    pwd2.classList.add(pwd1.value === pwd2.value ? 'is-valid' : 'is-invalid');
                }
            });
        });
    });
}

function togglePasswordVisibility() {
    document.querySelectorAll('.eye').forEach(eye => {
        eye.addEventListener('click', () => {
            eye.parentElement.querySelector('input[type="password"], input[type="text"]').type =
                eye.parentElement.querySelector('input[type="password"], input[type="text"]').type === 'password' ? 'text' : 'password';
            document.querySelectorAll('.eye').forEach(eye => {
                eye.innerHTML = eye.parentElement.querySelector('input[type="password"], input[type="text"]').type === 'text'
                    ? '<i class="fa-regular fa-eye-slash fa-lg"></i>'
                    : '<i class="fa-regular fa-eye fa-lg"></i>';
            });
        });
    });
}

function signUp() {
    document.getElementById('signUp').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!document.getElementById('signUp').checkValidity()) {
            document.getElementById('signUp').classList.add('was-validated');
            return;
        }
        const email = document.getElementById('email').value.trim(),
            password = document.getElementById('pwd1').value;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                updateProfile(auth.currentUser, {
                    displayName: document.getElementById('username').value,
                }).then(() => {
                    alert(`Welcome to Newz Kript, ${userCredential.user.displayName}!`);
                    window.location.href = 'login.html';
                });
            })
            .catch(error => {
                alert(error.code === 'auth/email-already-in-use'
                    ? `${email} has already been used to sign up. Please login!`
                    : `Oops, something went wrong. Please try again later!
                    ${error.code}`);
                console.error(error.code);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initBootstrapValidation();
    togglePasswordVisibility();
    signUp();
});
