import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import mediaReducer from "./slices/mediaSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    media: mediaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
