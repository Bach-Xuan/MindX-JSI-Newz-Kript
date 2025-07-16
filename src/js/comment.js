// comment.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    limit,
    addDoc,
    serverTimestamp,
    where
} from 'https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js';

let currentUser = null;
let commentsColRef = null;
let commentsUnsub = null;
const MAX_TOP_LEVEL = 50;

// Cache DOM elements
const listEl = document.getElementById('comments-list');
const formEl = document.getElementById('comment-form');
const inputEl = document.getElementById('comment-input');

document.addEventListener('DOMContentLoaded', initComments);

function initComments() {
    // Grab article ID
    const raw = localStorage.getItem('selectedArticle');
    if (!raw) {
        console.error('No article selected');
        return;
    }

    let article;
    try {
        article = JSON.parse(raw);
    } catch {
        console.error('Invalid article JSON');
        return;
    }

    const articleId = article.id
        || (article.link ? btoa(article.link) : btoa(article.title || 'unknown'));
    document.querySelector('main')?.setAttribute('data-article-id', articleId);

    commentsColRef = collection(db, 'articles', articleId, 'comments');

    // Set up auth listener
    onAuthStateChanged(auth, handleAuthChange, console.error);

    // Always load comments
    setupCommentsListener();
}

function handleAuthChange(user) {
    currentUser = user;
    if (!formEl || !inputEl) return;

    // Clear any previous login message
    document.querySelector('.login-message')?.remove();

    if (!user) {
        formEl.style.display = 'none';
        const msg = document.createElement('div');
        msg.className = 'login-message';
        msg.innerHTML = `<p>Please <a href="login.html">log in</a> to post comments.</p>`;
        formEl.parentNode.insertBefore(msg, formEl);

        // Remove form submit listener if any
        formEl.removeEventListener('submit', onPostComment);
    } else {
        formEl.style.display = 'block';
        formEl.addEventListener('submit', onPostComment);
    }
}

async function onPostComment(e) {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    try {
        await addDoc(commentsColRef, {
            content: text,
            parentId: null,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email || 'Anonymous',
            createdAt: serverTimestamp()
        });
        inputEl.value = '';
    } catch (err) {
        console.error('Failed to post comment:', err);
        alert('Error posting comment. Please try again.');
    }
}

function setupCommentsListener() {
    if (!commentsColRef || !listEl) return;

    // Clean up previous listener
    commentsUnsub?.();

    // Top‑level comments query
    const topQuery = query(
        commentsColRef,
        where('parentId', '==', null),
        orderBy('createdAt', 'desc'),
        limit(MAX_TOP_LEVEL)
    );

    commentsUnsub = onSnapshot(topQuery, snapshot => {
        listEl.innerHTML = '';
        if (snapshot.empty) {
            listEl.innerHTML = '<li class="no-comments">No comments yet. Be the first!</li>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            listEl.appendChild(renderComment(docSnap.id, data));
        });
    }, err => {
        console.error('Comments listener error:', err);
        listEl.innerHTML = '<li class="error-message">Could not load comments.</li>';
    });
}

function renderComment(id, data) {
    const li = document.createElement('li');
    li.className = 'comment-item';
    const dateStr = formatDate(data.createdAt);

    li.innerHTML = `
    <div class="comment-header">
      <strong class="comment-author">${escapeHtml(data.authorName)}</strong>
      <span class="comment-date">${dateStr}</span>
    </div>
    <div class="comment-content">${escapeHtml(data.content)}</div>
    <div class="comment-actions">
      <button class="reply-button" ${!currentUser ? 'disabled' : ''}>
        <i class="fas fa-reply"></i> Reply
      </button>
    </div>
    <ul class="replies-list" data-parent="${id}"></ul>
  `;

    const repliesList = li.querySelector('.replies-list');
    loadReplies(id, repliesList);

    const btn = li.querySelector('.reply-button');
    if (btn && currentUser) {
        btn.addEventListener('click', () => toggleReplyForm(li, id));
    }

    return li;
}

function loadReplies(parentId, container) {
    const repliesQ = query(
        commentsColRef,
        where('parentId', '==', parentId),
        orderBy('createdAt', 'asc')
    );

    onSnapshot(repliesQ, snap => {
        container.innerHTML = '';
        snap.forEach(docSnap => {
            const rd = docSnap.data();
            container.appendChild(renderReply(docSnap.id, rd));
        });
    }, console.error);
}

function renderReply(id, data) {
    const li = document.createElement('li');
    li.className = 'reply-item';
    const dateStr = formatDate(data.createdAt);

    li.innerHTML = `
    <div class="reply-header">
      <strong class="reply-author">${escapeHtml(data.authorName)}</strong>
      <span class="reply-date">${dateStr}</span>
    </div>
    <div class="reply-content">${escapeHtml(data.content)}</div>
    <div class="comment-actions">
      <button class="reply-button" ${!currentUser ? 'disabled' : ''}>
        <i class="fas fa-reply"></i> Reply
      </button>
    </div>
    <ul class="replies-list" data-parent="${id}"></ul>
  `;

    // Load nested replies for this reply
    const repliesList = li.querySelector('.replies-list');
    loadReplies(id, repliesList);

    // Add reply functionality to this reply
    const btn = li.querySelector('.reply-button');
    if (btn && currentUser) {
        btn.addEventListener('click', () => toggleReplyForm(li, id));
    }

    return li;
}

function toggleReplyForm(parentLi, parentId) {
    const existing = parentLi.querySelector('.reply-form');
    if (existing) return existing.remove();

    const formWrap = document.createElement('div');
    formWrap.className = 'reply-form';
    formWrap.innerHTML = `
    <form class="reply-inner">
      <textarea class="reply-input" placeholder="Write a reply…" required></textarea>
      <div class="reply-actions">
        <button type="submit" class="reply-submit">Reply</button>
        <button type="button" class="reply-cancel">Cancel</button>
      </div>
    </form>
  `;
    parentLi.appendChild(formWrap);

    const txt = formWrap.querySelector('.reply-input');
    const frm = formWrap.querySelector('form');
    const cancel = formWrap.querySelector('.reply-cancel');
    txt.focus();

    frm.addEventListener('submit', async e => {
        e.preventDefault();
        const val = txt.value.trim();
        if (!val) return;
        try {
            await addDoc(commentsColRef, {
                content: val,
                parentId,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email || 'Anonymous',
                createdAt: serverTimestamp()
            });
            formWrap.remove();
        } catch (err) {
            console.error('Reply error:', err);
            alert('Error posting reply.');
        }
    });

    cancel.addEventListener('click', () => formWrap.remove());
}

function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    try {
        return timestamp.toDate().toLocaleString();
    } catch {
        return 'Just now';
    }
}

function escapeHtml(str = '') {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}