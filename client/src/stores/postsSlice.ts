import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Thread } from '../hooks/useFetchPosts';

export interface PostsState {
  threads: Thread[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  threads: [],
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setThreads: (state, action: PayloadAction<Thread[]>) => {
      state.threads = action.payload;
    },
    addNewThread: (state, action: PayloadAction<Thread>) => {
      // Add new thread to the beginning of the array
      state.threads.unshift(action.payload);
    },
    updateThreadLikeStatus: (state, action: PayloadAction<{ threadId: number; isLiked: boolean; likesCount: number }>) => {
      const { threadId, isLiked, likesCount } = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        thread.isLiked = isLiked;
        thread.likes = likesCount;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setThreads, addNewThread, updateThreadLikeStatus, setLoading, setError } = postsSlice.actions;
export default postsSlice.reducer;
