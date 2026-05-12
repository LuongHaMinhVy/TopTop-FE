import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MediaState {
  isMuted: boolean;
  volume: number;
}

const loadMediaState = (): MediaState => {
  if (typeof window === 'undefined') {
    return {
      isMuted: true,
      volume: 1,
    };
  }

  const saved = localStorage.getItem('media');

  if (saved) {
    return {...JSON.parse(saved), isMuted: true};
  }

  return {
    isMuted: true,
    volume: 1,
  };
};

const saveMediaState = (state: MediaState) => {
  localStorage.setItem('media', JSON.stringify(state));
};

const initialState: MediaState = loadMediaState();

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setMuted: (state : { isMuted: boolean, volume: number}, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;

      saveMediaState(state);
    },

    setVolume: (state:  { isMuted: boolean, volume: number}, action: PayloadAction<number>) => {
      state.volume = action.payload;

      state.isMuted = action.payload <= 0;

      saveMediaState(state);
    },

    toggleMuted: (state: { isMuted: boolean, volume: number}) => {
      state.isMuted = !state.isMuted;

      if (!state.isMuted && state.volume === 0) {
        state.volume = 0.5;
      }

      saveMediaState(state);
    },
  },
});

export const { setMuted, setVolume, toggleMuted } =
  mediaSlice.actions;

export default mediaSlice.reducer;