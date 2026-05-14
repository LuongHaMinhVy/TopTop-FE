import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MediaState {
  isMuted: boolean;
  volume: number;
  autoScroll: boolean;
}

const loadMediaState = (): MediaState => {
  if (typeof window === 'undefined') {
    return {
      isMuted: true,
      volume: 1,
      autoScroll: false,
    };
  }

  const saved = localStorage.getItem('media');

  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      isMuted: parsed.isMuted ?? true,
      volume: parsed.volume ?? 1,
      autoScroll: parsed.autoScroll ?? false,
    };
  }

  return {
    isMuted: true,
    volume: 1,
    autoScroll: false,
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
    setMuted: (state: MediaState, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;

      saveMediaState(state);
    },

    setVolume: (state: MediaState, action: PayloadAction<number>) => {
      state.volume = action.payload;

      state.isMuted = action.payload <= 0;

      saveMediaState(state);
    },

    toggleMuted: (state: MediaState) => {
      state.isMuted = !state.isMuted;

      if (!state.isMuted && state.volume === 0) {
        state.volume = 0.5;
      }

      saveMediaState(state);
    },

    setAutoScroll: (state: MediaState, action: PayloadAction<boolean>) => {
      state.autoScroll = action.payload;
      saveMediaState(state);
    },
  },
});

export const { setMuted, setVolume, toggleMuted, setAutoScroll } =
  mediaSlice.actions;

export default mediaSlice.reducer;