import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { addMessage, deleteMessageState } from '../store/slices/messageSlice';

const WS_URL = 'ws://localhost:8000/ws';

export const useWebSocket = (roomId: string | null) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId || !token) {
      return;
    }

    const connect = () => {
      const socket = new WebSocket(`${WS_URL}/${roomId}?token=${token}`);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log(`WebSocket connected to room ${roomId}`);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Dispatch actions based on incoming message type
        switch (data.type) {
          case 'message':
            dispatch(addMessage(data));
            break;
          case 'message_deleted':
            dispatch(deleteMessageState({ roomId: data.room_id, messageId: data.message_id }));
            break;
          // Add other cases for user_joined, user_left, etc.
          default:
            console.log('Received unhandled WebSocket message:', data);
        }
      };

      socket.onclose = () => {
        console.log(`WebSocket disconnected from room ${roomId}`);
        // Optional: implement reconnection logic here
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [roomId, token, dispatch]);

  const sendMessage = (message: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
};
