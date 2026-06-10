import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';
// socket.io-client uses the URL's pathname as the namespace (e.g., /hafsa).
// We must pass only the origin — no path — so the namespace defaults to "/".
const SOCKET_URL = (() => {
  // This code runs in browser context, so new URL(absolute) always works.
  // For relative API_URL (dev proxy), fall back to empty string (same-origin).
  try { return new URL(API_URL).origin; } catch { return ''; }
})();
// Path is always /socket.io. When SOCKET_URL is absolute, nginx handles
// proxying via the dedicated /socket.io/ location. When empty (same-origin
// dev), Vite's proxy or the dev server handles it.
const SOCKET_PATH = '/socket.io';

let socket: Socket | null = null;
let notificationHandler: ((notification: any) => void) | null = null;
const pendingListeners: { event: string; cb: (...args: any[]) => void }[] = [];

export const onNewNotification = (handler: (notification: any) => void) => {
  notificationHandler = handler;
};

export const connectSocket = () => {
  const token = getToken();
  if (!token || socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    auth: { token },
    // prefer websocket but allow polling fallback; tune reconnection to reduce noisy retries
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    // exponential backoff upper bound
    reconnectionDelayMax: 30000,
    // jitter/randomization
    randomizationFactor: 0.5,
    timeout: 20000, // MS to wait for initial connect
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    pendingListeners.forEach(({ event, cb }) => socket!.on(event, cb));
    pendingListeners.length = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    try {
      const msg = error?.message || String(error);
      console.error('Socket connection error:', msg, error);
      // Log to backend if available
      if (msg.includes('Invalid namespace') || msg.includes('timeout')) {
        console.warn('Socket path may be misconfigured. Check VITE_API_URL and nginx proxy config.');
        console.log('Resolved SOCKET_URL:', SOCKET_URL, 'SOCKET_PATH:', SOCKET_PATH);
      }
    } catch (e) {
      console.error('Socket connection error (unknown)');
    }
  });

  socket.on('new_notification', (notification: any) => {
    console.log('New notification:', notification);
    notificationHandler?.(notification);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    notificationHandler = null;
  }
};

export const onNewPostInFeed = (cb: (data: { postId: string; authorId: string }) => void) => {
  if (socket?.connected) {
    socket.on('new_post_in_feed', cb);
  } else {
    pendingListeners.push({ event: 'new_post_in_feed', cb });
  }
  return () => {
    socket?.off('new_post_in_feed', cb);
    const idx = pendingListeners.findIndex(l => l.cb === cb);
    if (idx !== -1) pendingListeners.splice(idx, 1);
  };
};

export const onUserOnline = (cb: (data: { userId: string }) => void) => {
  if (!socket) return;
  socket.on('user_online', cb);
};

export const onUserOffline = (cb: (data: { userId: string; lastSeenAt: Date }) => void) => {
  if (!socket) return;
  socket.on('user_offline', cb);
};

export const emitPostCreated = (postId: string) => {
  if (!socket) return;
  socket.emit('post_created', { postId });
};

export const getSocket = () => socket;
