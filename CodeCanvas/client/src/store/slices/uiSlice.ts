import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isCreateRoomModalOpen: boolean;
  isProfileSettingsModalOpen: boolean;
  isTransferOwnershipModalOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UiState = {
  isCreateRoomModalOpen: false,
  isProfileSettingsModalOpen: false,
  isTransferOwnershipModalOpen: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCreateRoomModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateRoomModalOpen = action.payload;
    },
    setProfileSettingsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isProfileSettingsModalOpen = action.payload;
    },
    setTransferOwnershipModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isTransferOwnershipModalOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const {
  setCreateRoomModalOpen,
  setProfileSettingsModalOpen,
  setTransferOwnershipModalOpen,
  toggleTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
