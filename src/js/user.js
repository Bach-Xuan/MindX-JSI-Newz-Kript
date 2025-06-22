import { auth } from './firebase-config.js';
import {
    signOut,
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    updatePassword
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';


function logOut() {
    document.getElementById('signOut').addEventListener('click', () => {
        signOut(auth).then(() => {
            alert('You have successfully signed out.');
            window.location.href = 'login.html';
        }).catch((error) => {
            alert("Oops, something went wrong. Please try again!");
            console.error(error.code);
        });
    });
}

function showUserInfo() {
    onAuthStateChanged(auth, user => {
        if (user) {
            document.getElementById("uid").textContent = `UID: ${user.uid}`;
            document.getElementById("username").textContent = `Username: ${user.displayName}`;
            document.getElementById("email").textContent = `Email: ${user.email}`;
        } else {
            document.getElementById("username").textContent = "Username: N/A";
            document.getElementById("email").textContent = "Email: N/A";
            document.getElementById("uid").textContent = "UID: N/A";
        }
    });
}

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
    document.querySelectorAll('.form-floating input[type=password]').forEach(pwd => {
        pwd.oninput = () =>
            pwd.parentNode.querySelector('.eye').style.display = pwd.value ? 'block' : 'none';
        pwd.parentNode.querySelector('.eye').onclick = () => {
            pwd.type = pwd.type === 'password' ? 'text' : 'password';
            pwd.parentNode.querySelector('.eye').innerHTML =
                `<i class="fa-regular fa-eye${pwd.type === 'text' ? '-slash' : ''} fa-lg"></i>`;
        };
    });
}

function update() {
    document.getElementById('update').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!document.getElementById('update').checkValidity()) {
            document.getElementById('update').classList.add('was-validated');
            return;
        }
        const username = document.getElementById('username').value,
            email = document.getElementById('email').value,
            pwd = document.getElementById('pwd1').value;
        updateProfile(auth.currentUser, { displayName: username })
            .then(() => {
                return updateEmail(auth.currentUser, email);
            })
            .then(() => {
                return updatePassword(auth.currentUser, pwd);
            })
            .then(() => {
                alert('Updated successfully!');
                window.location.href = 'login.html';
            }).catch((error) => {
                alert('Oops, something went wrong. Please try again!');
                console.error(error.code);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    logOut();
    showUserInfo();
    initBootstrapValidation();
    togglePasswordVisibility();
    update();
});