import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// Define the shape of the user object and auth state
interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  phone_number?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: sessionStorage.getItem('token'),
  status: 'idle',
  error: null,
};

// Async thunks for API calls
export const loginUser = createAsyncThunk('auth/login', async (loginData: FormData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', loginData);
    const { access_token } = response.data;
    sessionStorage.setItem('token', access_token);
    return access_token;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const fetchUserProfile = createAsyncThunk('auth/fetchProfile', async (_, { getState, rejectWithValue }) => {
  // api instance already has interceptor for token, so we don't need to manually add it
  // provided the token is in localStorage or store (interceptor reads from store)

  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      sessionStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = 'succeeded';
        state.token = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch Profile
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        // If fetching profile fails, the token is likely invalid, so log out
        state.user = null;
        state.token = null;
        sessionStorage.removeItem('token');
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
