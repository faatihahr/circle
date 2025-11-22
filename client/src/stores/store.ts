import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice.ts';
import { postsReducer } from './postsSlice.ts';
import followReducer from './followSlice.ts';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
    follow: followReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
