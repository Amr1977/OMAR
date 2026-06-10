// This file is generated at build time — update these values for your Firebase project
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD_qEYXTR9Y6oBkZqbvLFvxNnD8TzMVIwI',
  authDomain: 'hafsa-77.firebaseapp.com',
  projectId: 'hafsa-77',
  storageBucket: 'hafsa-77.firebasestorage.app',
  messagingSenderId: '891711148532',
  appId: '1:891711148532:web:759503c65bfcc0073229a1',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { notification, data } = payload;
  const title = notification?.title || 'حفصة';
  const options = {
    body: notification?.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = '/';
  if (data.type === 'new_message' && data.conversationId) url = `/messages/${data.conversationId}`;
  else if (data.type === 'post_like' && data.postId) url = `/social/post/${data.postId}`;
  else if (data.type === 'post_comment' && data.postId) url = `/social/post/${data.postId}`;
  else if (data.type === 'contact_request') url = '/requests/received';
  else if (data.type === 'profile_view') url = '/profile/my';
  event.waitUntil(clients.openWindow(url));
});
