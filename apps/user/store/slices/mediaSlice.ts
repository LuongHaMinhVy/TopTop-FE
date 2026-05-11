import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MediaState {
  isMuted: boolean;
  volume: number;
}

const initialState: MediaState = {
  isMuted: true,
  volume: 1,
};

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
      if (action.payload > 0) {
        state.isMuted = false;
      } else {
        state.isMuted = true;
      }
    },
    toggleMuted: (state) => {
      state.isMuted = !state.isMuted;
      if (!state.isMuted && state.volume === 0) {
        state.volume = 0.5;
      }
    },
  },
});

export const { setMuted, setVolume, toggleMuted } = mediaSlice.actions;
export default mediaSlice.reducer;
