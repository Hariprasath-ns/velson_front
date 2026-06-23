import { io } from 'socket.io-client';

let socket = null;

const getAuthToken = () => {
  try {
    const raw = localStorage.getItem('velson_auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      return token;
    }
  } catch (err) {
    // Ignore
  }
  return null;
};

const getSocketUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
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
    reconnectionDelay: 1000
  });

  // Listen to auth token refresh events to keep socket authenticated
  window.addEventListener('velson:auth_refreshed', (e) => {
    const newAuth = e.detail;
    if (newAuth && newAuth.token && socket) {
      socket.auth = { token: newAuth.token };
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    }
  });

  // Connect socket
  socket.connect();

  socket.on('connect', () => {
    console.log('[Socket] Connected to server.');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected from server:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

