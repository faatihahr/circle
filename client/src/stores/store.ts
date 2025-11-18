import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice.ts';
import postsReducer from './postsSlice.ts';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
