import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Thread } from '../hooks/useFetchPosts';

export interface PostsState {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  selectedThreadId: number | null;
  selectedUserId: number | null;
}

const initialState: PostsState = {
  threads: [],
  loading: false,
  error: null,
  selectedThreadId: null,
  selectedUserId: null,
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
    updateThreadReplyCount: (state, action: PayloadAction<{ threadId: number; increment: number }>) => {
      const { threadId, increment } = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        thread.reply += increment;
      }
    },
    selectThread: (state, action: PayloadAction<number>) => {
      state.selectedThreadId = action.payload;
    },
    deselectThread: (state) => {
      state.selectedThreadId = null;
    },
    selectUser: (state, action: PayloadAction<number>) => {
      state.selectedUserId = action.payload;
    },
    deselectUser: (state) => {
      state.selectedUserId = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setThreads, addNewThread, updateThreadLikeStatus, updateThreadReplyCount, selectThread, deselectThread, selectUser, deselectUser, setLoading, setError } = postsSlice.actions;

export const postsReducer = postsSlice.reducer;
