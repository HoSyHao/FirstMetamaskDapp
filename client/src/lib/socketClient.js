// src/lib/socketClient.js (cần đảm bảo đã có)
import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants/api';

export const socket = io(SERVER_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

export const useSocket = () => {
  const subscribe = (userAddress) => {
    if (userAddress) socket.emit('subscribe', { userAddress });
  };
  return { subscribe };
};