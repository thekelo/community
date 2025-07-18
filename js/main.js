/**
 * Main JavaScript for the community site
 */

import { formatDate, truncateText } from './utils.js';
import { auth, db } from './firebase-config.js';

// DOM Elements
const featuredPostsContainer = document.getElementById('featuredPosts');
const recentMembersContainer = document.getElementById('recentMembers');
const memberCountElement = document.getElementById('memberCount');
const postCountElement = document.getElementById('postCount');
const authButtons = document.getElementById('authButtons');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const usernameElement = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');

// Global variables
let currentUser = null;

// Initialize the application
function initApp() {
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            updateUIForUser(user);
            loadCommunityData();
        } else {
            // No user is signed in
            currentUser = null;
            updateUIForGuest();
        }
    });

    // Load featured posts
    loadFeaturedPosts();

    // Load recent members
    loadRecentMembers();

    // Set up logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Update UI for authenticated user
function updateUIForUser(user) {
    if (authButtons) authButtons.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    
    // Update user profile info
    if (user.photoURL) {
        userAvatar.src = user.photoURL;
    }
    usernameElement.textContent = user.displayName || user.email.split('@')[0];
}

// Update UI for guest
function updateUIForGuest() {
    if (authButtons) authButtons.style.display = 'flex';
    if (userProfile) userProfile.style.display = 'none';
}

// Load community statistics
async function loadCommunityData() {
    try {
        // Get member count
        const membersSnapshot = await db.collection('users').get();
        if (memberCountElement) {
            memberCountElement.textContent = membersSnapshot.size;
        }

        // Get post count
        const postsSnapshot = await db.collection('posts').get();
        if (postCountElement) {
            postCountElement.textContent = postsSnapshot.size;
        }
    } catch (error) {
        console.error('Error loading community data:', error);
    }
}

// Load featured posts
async function loadFeaturedPosts() {
    try {
        const querySnapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();

        if (featuredPostsContainer) {
            featuredPostsContainer.innerHTML = '';

            if (querySnapshot.empty) {
                featuredPostsContainer.innerHTML = '<p class="no-posts">No posts found. Be the first to create one!</p>';
                return;
            }

            querySnapshot.forEach(doc => {
                const post = doc.data();
                featuredPostsContainer.appendChild(createPostCard(post));
            });
        }
    } catch (error) {
        console.error('Error loading featured posts:', error);
        if (featuredPostsContainer) {
            featuredPostsContainer.innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
        }
    }
}

// Load recent members
async function loadRecentMembers() {
    try {
        const querySnapshot = await db.collection('users')
            .orderBy('joinedAt', 'desc')
            .limit(8)
            .get();

        if (recentMembersContainer) {
            recentMembersContainer.innerHTML = '';

            if (querySnapshot.empty) {
                recentMembersContainer.innerHTML = '<p class="no-members">No members found.</p>';
                return;
            }

            querySnapshot.forEach(doc => {
                const user = doc.data();
                recentMembersContainer.appendChild(createMemberCard(user));
            });
        }
    } catch (error) {
        console.error('Error loading recent members:', error);
        if (recentMembersContainer) {
            recentMembersContainer.innerHTML = '<p class="error">Error loading members. Please try again later.</p>';
        }
    }
}

// Create post card element
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';

    postCard.innerHTML = `
        <div class="post-image" style="background-image: url('${post.imageURL || 'images/default-post.jpg'}')"></div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
                <img src="${post.authorAvatar || 'images/default-avatar.jpg'}" alt="${post.authorName}" class="post-author-avatar">
                <span>${post.authorName}</span>
                <span>•</span>
                <span>${formatDate(post.createdAt)}</span>
            </div>
            <p class="post-excerpt">${truncateText(post.content)}</p>
            <div class="post-stats">
                <span><i class="fas fa-thumbs-up"></i> ${post.likes || 0}</span>
                <span><i class="fas fa-comment"></i> ${post.commentCount || 0}</span>
            </div>
        </div>
    `;

    // Add click event to view post detail
    postCard.addEventListener('click', () => {
        window.location.href = `post-detail.html?id=${post.id}`;
    });

    return postCard;
}

// Create member card element
function createMemberCard(user) {
    const memberCard = document.createElement('div');
    memberCard.className = 'member-card';

    memberCard.innerHTML = `
        <img src="${user.photoURL || 'images/default-avatar.jpg'}" alt="${user.displayName}" class="member-avatar">
        <h4 class="member-name">${user.displayName || user.email.split('@')[0]}</h4>
        <p class="member-join-date">Joined ${formatDate(user.joinedAt)}</p>
    `;

    // Add click event to view profile
    memberCard.addEventListener('click', () => {
        window.location.href = `profile.html?id=${user.uid}`;
    });

    return memberCard;
}

// Handle logout
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch(error => {
        console.error('Logout error:', error);
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
