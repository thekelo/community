/**
 * Posts functionality for the community site
 */

import { auth, db } from './firebase-config.js';
import { formatDate, truncateText } from './utils.js';

// DOM Elements
const postsContainer = document.getElementById('postsContainer');
const createPostBtn = document.getElementById('createPostBtn');
const postForm = document.getElementById('postForm');
const postTitleInput = document.getElementById('postTitle');
const postContentInput = document.getElementById('postContent');
const postImageInput = document.getElementById('postImage');
const postImagePreview = document.getElementById('postImagePreview');

// Initialize posts page
function initPostsPage() {
    // Load all posts
    loadAllPosts();

    // Set up create post button
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            window.location.href = 'create-post.html';
        });
    }

    // Set up post form submission
    if (postForm) {
        postForm.addEventListener('submit', handlePostSubmit);
    }

    // Set up image preview
    if (postImageInput) {
        postImageInput.addEventListener('change', handleImageUpload);
    }
}

// Load all posts
async function loadAllPosts() {
    try {
        const querySnapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .get();

        if (postsContainer) {
            postsContainer.innerHTML = '';

            if (querySnapshot.empty) {
                postsContainer.innerHTML = '<p class="no-posts">No posts found. Be the first to create one!</p>';
                return;
            }

            querySnapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                postsContainer.appendChild(createPostElement(post));
            });
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        if (postsContainer) {
            postsContainer.innerHTML = '<p class="error">Error loading posts. Please try again later.</p>';
        }
    }
}

// Create post element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
        <div class="post-header">
            <img src="${post.authorAvatar || 'images/default-avatar.jpg'}" alt="${post.authorName}" class="post-author-avatar">
            <div class="post-author-info">
                <h4 class="post-author-name">${post.authorName}</h4>
                <p class="post-date">${formatDate(post.createdAt)}</p>
            </div>
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            ${post.imageURL ? `<img src="${post.imageURL}" alt="${post.title}" class="post-image">` : ''}
            <p class="post-text">${post.content}</p>
        </div>
        <div class="post-actions">
            <button class="like-btn" data-post-id="${post.id}">
                <i class="fas fa-thumbs-up"></i> Like (${post.likes || 0})
            </button>
            <a href="post-detail.html?id=${post.id}" class="comment-btn">
                <i class="fas fa-comment"></i> Comment (${post.commentCount || 0})
            </a>
        </div>
    `;

    // Add like button event
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLikePost(post.id));
    }

    return postElement;
}

// Handle post submission
async function handlePostSubmit(e) {
    e.preventDefault();
    
    if (!auth.currentUser) {
        alert('Please login to create a post');
        window.location.href = 'auth.html?mode=login';
        return;
    }

    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();
    const imageFile = postImageInput.files[0];

    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        let imageURL = '';
        
        // Upload image if exists
        if (imageFile) {
            imageURL = await uploadImage(imageFile);
        }

        // Create post in Firestore
        await db.collection('posts').add({
            title,
            content,
            imageURL,
            authorId: auth.currentUser.uid,
            authorName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            authorAvatar: auth.currentUser.photoURL || '',
            likes: 0,
            commentCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Post created successfully!');
        window.location.href = 'posts.html';
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
    }
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        postImagePreview.src = event.target.result;
        postImagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Upload image to Firebase Storage
async function uploadImage(file) {
    // You'll need to implement this when setting up Firebase Storage
    // This is a placeholder implementation
    return new Promise((resolve) => {
        // In a real implementation, you would:
        // 1. Create a reference to the storage location
        // 2. Upload the file
        // 3. Get the download URL
        // 4. Return the URL
        
        // For now, we'll just return a placeholder
        setTimeout(() => {
            resolve('images/default-post.jpg');
        }, 1000);
    });
}

// Handle liking a post
async function handleLikePost(postId) {
    if (!auth.currentUser) {
        alert('Please login to like posts');
        window.location.href = 'auth.html?mode=login';
        return;
    }

    try {
        const postRef = db.collection('posts').doc(postId);
        const likeRef = db.collection('likes').doc(`${postId}_${auth.currentUser.uid}`);

        // Check if user already liked the post
        const likeDoc = await likeRef.get();

        if (likeDoc.exists) {
            // Unlike the post
            await likeRef.delete();
            await postRef.update({
                likes: firebase.firestore.FieldValue.increment(-1)
            });
        } else {
            // Like the post
            await likeRef.set({
                postId,
                userId: auth.currentUser.uid,
                likedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await postRef.update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
        }

        // Refresh the posts
        loadAllPosts();
    } catch (error) {
        console.error('Error liking post:', error);
        alert('Error liking post. Please try again.');
    }
}

// Initialize posts page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPostsPage);
