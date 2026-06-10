import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';
// Derive socket base and path robustly from API_URL so clients behind subpath proxies
// (e.g., /hafsa/api) connect to the correct upgrade endpoint (/hafsa/socket.io)
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '') || '';
let SOCKET_PATH = '/socket.io';
try {
  if (SOCKET_URL) {
    // If SOCKET_URL is an absolute url, extract pathname
    const u = SOCKET_URL.match(/^https?:\/\/(.+?)(\/.*)?$/);
    if (u && u[2]) {
      // Strip /api from path if present (socket endpoint is at base path, not /api)
      const basePath = u[2].replace(/\/api\/?$/, '');
      SOCKET_PATH = (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath) + '/socket.io';
    } else if (SOCKET_URL.startsWith('/')) {
      SOCKET_PATH = (SOCKET_URL.endsWith('/') ? SOCKET_URL.slice(0, -1) : SOCKET_URL) + '/socket.io';
    }
  }
} catch (e) {
  SOCKET_PATH = '/socket.io';
}

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
