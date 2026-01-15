import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const createSocket = () => {
  return io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });
};
