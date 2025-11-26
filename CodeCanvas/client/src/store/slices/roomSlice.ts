import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Define types
interface Room {
  id: string;
  name: string;
  description?: string;
  // ... other room properties
}

interface Member {
  id: string;
  username: string;
  // ... other member properties
}

interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
  members: Member[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: RoomState = {
  rooms: [],
  selectedRoom: null,
  members: [],
  status: 'idle',
  error: null,
};

// Async Thunks
export const fetchRooms = createAsyncThunk('rooms/fetchRooms', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchRoomDetails = createAsyncThunk('rooms/fetchRoomDetails', async (roomId: string, { rejectWithValue }) => {
  try {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const createRoom = createAsyncThunk('rooms/createRoom', async (roomData: { name: string, description: string }, { rejectWithValue }) => {
  try {
    const response = await api.post('/rooms', roomData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const roomSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setSelectedRoom: (state, action: PayloadAction<string>) => {
      const room = state.rooms.find(r => r.id === action.payload);
      state.selectedRoom = room || null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Rooms
      .addCase(fetchRooms.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<Room[]>) => {
        state.status = 'succeeded';
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch Room Details
      .addCase(fetchRoomDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.selectedRoom = action.payload;
        state.members = action.payload.members;
      })
      // Create Room
      .addCase(createRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        state.rooms.push(action.payload);
      });
  },
});

export const { setSelectedRoom } = roomSlice.actions;

export default roomSlice.reducer;
