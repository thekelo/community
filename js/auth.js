/**
 * Authentication logic for the community site
 */

import { auth, db } from './firebase-config.js';

// DOM Elements
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const confirmPasswordInput = document.getElementById('confirmPassword');
const authTabButtons = document.querySelectorAll('.auth-tab');
const authTabs = document.querySelectorAll('.auth-content');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const googleLoginBtn = document.getElementById('googleLogin');
const facebookLoginBtn = document.getElementById('facebookLogin');

// Check URL for mode (login/signup)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'login';

// Initialize auth page
function initAuthPage() {
    // Set active tab based on URL parameter
    setActiveTab(mode);

    // Set up tab switching
    authTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabMode = button.getAttribute('data-mode');
            setActiveTab(tabMode);
            window.history.replaceState(null, null, `?mode=${tabMode}`);
        });
    });

    // Set up form submission
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    // Set up social login buttons
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', signInWithGoogle);
    }

    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', signInWithFacebook);
    }
}

// Set active tab
function setActiveTab(tabMode) {
    authTabButtons.forEach(button => {
        if (button.getAttribute('data-mode') === tabMode) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    authTabs.forEach(tab => {
        if (tab.getAttribute('data-mode') === tabMode) {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });

    // Update form button text
    const submitButton = authForm.querySelector('.btn');
    if (submitButton) {
        submitButton.textContent = tabMode === 'login' ? 'Login' : 'Sign Up';
    }
}

// Handle form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    hideMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput ? nameInput.value.trim() : null;
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : null;
    const isLogin = window.location.search.includes('mode=login');

    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (!isLogin && password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        if (isLogin) {
            // Login existing user
            await auth.signInWithEmailAndPassword(email, password);
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            // Register new user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: name,
                photoURL: '',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showSuccess('Registration successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1500);
        }
    } catch (error) {
        console.error('Authentication error:', error);
        handleAuthError(error);
    }
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Check if user is new
        if (result.additionalUserInfo.isNewUser) {
            await db.collection('users').doc(result.user.uid).set({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Google sign-in error:', error);
        handleAuthError(error);
    }
}

// Sign in with Facebook
async function signInWithFacebook() {
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Check if user is new
        if (result.additionalUserInfo.isNewUser) {
            await db.collection('users').doc(result.user.uid).set({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Facebook sign-in error:', error);
        handleAuthError(error);
    }
}

// Handle authentication errors
function handleAuthError(error) {
    let errorMessage = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'Email is already in use.';
            break;
        case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
        case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
        case 'auth/user-not-found':
            errorMessage = 'User not found.';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
    }
    
    showError(errorMessage);
}

// Show error message
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
}

// Show success message
function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
}

// Hide all messages
function hideMessages() {
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
}

// Initialize auth page when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuthPage);
