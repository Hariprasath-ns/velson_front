import { io } from 'socket.io-client';

let socket = null;
let authRefreshListenerAdded = false;  // ADD — prevents duplicate listeners

const getAuthToken = () => {
  try {
    const raw = localStorage.getItem('velson_auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      return token;
    }
  } catch (err) {}
  return null;
};

const getSocketUrl = () => {
  if (import.meta.env.DEV) return 'http://localhost:3000';
  return window.location.origin;
};

export const initSocket = () => {
  if (socket) {
    const token = getAuthToken();
    if (token && socket.auth?.token !== token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  const token = getAuthToken();

  socket = io(getSocketUrl(), {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // ADD GUARD — only register this listener once ever
  if (!authRefreshListenerAdded) {
    authRefreshListenerAdded = true
    window.addEventListener('velson:auth_refreshed', (e) => {
      const newAuth = e.detail;
      if (newAuth?.token && socket) {
        socket.auth = { token: newAuth.token };
        // Don't force reconnect here — AuthContext's effect is the single
        // source of truth for reconnecting on token change. This just keeps
        // socket.auth current for any future reconnect attempt.
      }
    });
  }

  socket.on('connect', () => {
    console.log('[Socket] Connected to server.');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from server:', reason);
  });

  // MOVE connect() to last line — after all listeners are registered
  socket.connect();

  return socket;
};

export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    authRefreshListenerAdded = false;  // ADD — reset so next login works
  }
};