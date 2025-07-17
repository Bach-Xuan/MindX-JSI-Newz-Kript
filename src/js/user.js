import { auth } from './firebase-config.js';
import {
    signOut,
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';

onAuthStateChanged(auth, user => {
    if (!user) {
        window.stop();
        alert('Please login first!');
        window.location.href = 'login.html';
    }
})

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
            // Update display elements
            document.getElementById("uid").textContent = `UID: ${user.uid}`;
            document.getElementById("displayUsername").textContent = `Username: ${user.displayName || 'Not set'}`;
            document.getElementById("displayEmail").textContent = `Email: ${user.email}`;

            // Pre-populate form fields with current values
            document.getElementById("username").value = user.displayName || '';
            document.getElementById("email").value = user.email || '';
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

                // For password fields, handle optional validation
                if (input === pwd1 || input === pwd2) {
                    if (input.value) {
                        input.classList.add(input.checkValidity() ? 'is-valid' : 'is-invalid');
                    }
                    // Check password confirmation
                    if (pwd1.value || pwd2.value) {
                        pwd2.classList.remove('is-valid', 'is-invalid');
                        if (pwd2.value) {
                            pwd2.classList.add(pwd1.value === pwd2.value ? 'is-valid' : 'is-invalid');
                        }
                    }
                } else {
                    // For other required fields
                    if (input.value) {
                        input.classList.add(input.checkValidity() ? 'is-valid' : 'is-invalid');
                    }
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

async function reauthenticateUser() {
    const currentPassword = prompt('Please enter your current password to continue:');
    if (!currentPassword) {
        throw new Error('Current password is required for security reasons.');
    }

    const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
    );

    await reauthenticateWithCredential(auth.currentUser, credential);
}

function update() {
    document.getElementById('update').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Custom validation for optional passwords
        const pwd1 = document.getElementById('pwd1');
        const pwd2 = document.getElementById('pwd2');
        const username = document.getElementById('username');
        const email = document.getElementById('email');

        let isValid = true;

        // Validate required fields
        if (!username.checkValidity()) {
            username.classList.add('is-invalid');
            isValid = false;
        }

        if (!email.checkValidity()) {
            email.classList.add('is-invalid');
            isValid = false;
        }

        // Validate password fields only if they have values
        if (pwd1.value && !pwd1.checkValidity()) {
            pwd1.classList.add('is-invalid');
            isValid = false;
        }

        if (pwd1.value && pwd2.value && pwd1.value !== pwd2.value) {
            pwd2.classList.add('is-invalid');
            isValid = false;
        }

        if (pwd1.value && !pwd2.value) {
            pwd2.classList.add('is-invalid');
            isValid = false;
        }

        if (!isValid) {
            document.getElementById('update').classList.add('was-validated');
            return;
        }

        const usernameValue = username.value;
        const emailValue = email.value;
        const pwdValue = pwd1.value;
        const currentUser = auth.currentUser;

        if (!currentUser) {
            alert('No user is currently signed in.');
            return;
        }

        try {
            // For sensitive operations like email/password changes, we need reauthentication
            const needsReauth = emailValue !== currentUser.email || pwdValue.trim() !== '';

            if (needsReauth) {
                await reauthenticateUser();
            }

            // Update profile (display name) first
            if (usernameValue !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: usernameValue });
            }

            // Update email if changed
            if (emailValue !== currentUser.email) {
                await updateEmail(currentUser, emailValue);
            }

            // Update password if provided
            if (pwdValue.trim() !== '') {
                await updatePassword(currentUser, pwdValue);
            }

            alert('Profile updated successfully!');

            // Refresh the user info display
            showUserInfo();

            // Clear password fields for security
            pwd1.value = '';
            pwd2.value = '';

            // Remove validation classes
            document.getElementById('update').classList.remove('was-validated');
            document.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });

        } catch (error) {
            console.error('Update error:', error);

            // Handle specific error cases
            if (error.code === 'auth/requires-recent-login') {
                alert('For security reasons, please log out and log back in before making these changes.');
            } else if (error.code === 'auth/email-already-in-use') {
                alert('This email is already in use by another account.');
            } else if (error.code === 'auth/weak-password') {
                alert('Password is too weak. Please choose a stronger password.');
            } else if (error.code === 'auth/invalid-email') {
                alert('Invalid email format.');
            } else if (error.code === 'auth/wrong-password') {
                alert('Current password is incorrect.');
            } else {
                alert('Failed to update profile. Please try again.');
            }
        }
    });
}

// Add home button functionality
function setupHomeButton() {
    document.getElementById('home').addEventListener('click', () => {
        window.location.href = 'index.html'; // Adjust path as needed
    });
}

document.addEventListener('DOMContentLoaded', () => {
    logOut();
    showUserInfo();
    initBootstrapValidation();
    togglePasswordVisibility();
    update();
    setupHomeButton();
});