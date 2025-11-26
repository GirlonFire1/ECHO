import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Types
interface Message {
  id: string;
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'VIDEO';
  user_id: string;
  room_id: string;
  created_at: string;
}

interface MessagesState {
  messagesByRoom: Record<string, Message[]>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MessagesState = {
  messagesByRoom: {},
  status: 'idle',
  error: null,
};

// Async Thunks
export const fetchMessages = createAsyncThunk('messages/fetchMessages', async (roomId: string, { rejectWithValue }) => {
  try {
    const response = await api.get(`/rooms/${roomId}/messages`);
    return { roomId, messages: response.data };
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const { room_id } = action.payload;
      if (!state.messagesByRoom[room_id]) {
        state.messagesByRoom[room_id] = [];
      }
      state.messagesByRoom[room_id].push(action.payload);
    },
    deleteMessageState: (state, action: PayloadAction<{ roomId: string, messageId: string }>) => {
      const { roomId, messageId } = action.payload;
      if (state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = state.messagesByRoom[roomId].filter(msg => msg.id !== messageId);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messagesByRoom[action.payload.roomId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { addMessage, deleteMessageState } = messageSlice.actions;

export default messageSlice.reducer;
