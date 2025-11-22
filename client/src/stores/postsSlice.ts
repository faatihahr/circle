import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { postsAPI } from '../lib/api';
import type { Thread } from '../lib/types';

export interface PostsState {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  loadingMore: boolean; // TAMBANG: Untuk loading state saat fetch more
  hasMore: boolean; // TAMBANG: Apakah masih ada posts yang bisa di-load
  nextCursor: number | null; // TAMBANG: ID post terakhir untuk cursor pagination
  selectedThreadId: number | null;
  selectedUserId: number | null;
}

const initialState: PostsState = {
  threads: [],
  loading: false,
  error: null,
  loadingMore: false, // Initial false
  hasMore: true, // Default true untuk load pertama kali
  nextCursor: null,
  selectedThreadId: null,
  selectedUserId: null,
};

// Thunk untuk fetch posts awal (sudah ada, tetap)
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getAllPosts(); // Fetch pertama pakai cursor 0 dan limit 10
      if (response.code === 200) {
        return response.data; // Harus return { threads, hasMore, nextCursor }
      } else {
        return rejectWithValue('Failed to fetch threads');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching threads');
    }
  }
);

// THUNK BARU: Untuk fetch more posts dengan pagination
export const fetchMorePosts = createAsyncThunk(
  'posts/fetchMorePosts',
  async ({ cursor, limit = 10 }: { cursor: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await postsAPI.getAllPosts(cursor, limit);
      if (response.code === 200) {
        return response.data; // Return { threads, hasMore, nextCursor }
      } else {
        return rejectWithValue('Failed to fetch more threads');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching more threads');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setThreads: (state, action: PayloadAction<Thread[]>) => {
      state.threads = action.payload;
    },
    addNewThread: (state, action: PayloadAction<Thread>) => {
      state.threads.unshift(action.payload); // Tambah post baru di atas
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.threads = action.payload.threads;
        // UPDATE: Set pagination state dari response API
        state.hasMore = action.payload.hasMore ?? false;
        state.nextCursor = action.payload.nextCursor ?? null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // HANDLER BARU UNTUK PAGINATION
      .addCase(fetchMorePosts.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMorePosts.fulfilled, (state, action) => {
        state.loadingMore = false;
        // APPEND posts baru ke existing array
        state.threads = [...state.threads, ...action.payload.threads];
        // Update pagination state
        state.hasMore = action.payload.hasMore ?? false;
        state.nextCursor = action.payload.nextCursor ?? null;
      })
      .addCase(fetchMorePosts.rejected, (state, action) => {
        state.loadingMore = false;
        // Bisa tambah error handling atau toast kalau mau
        console.error('Failed to load more posts:', action.payload);
      });
  },
});

export const {
  setThreads,
  addNewThread,
  updateThreadLikeStatus,
  updateThreadReplyCount,
  selectThread,
  deselectThread,
  selectUser,
  deselectUser,
  setLoading,
  setError
} = postsSlice.actions;

export const postsReducer = postsSlice.reducer;



// import { createSlice } from '@reduxjs/toolkit';
// import type { PayloadAction } from '@reduxjs/toolkit';
// import type { Thread } from '../hooks/useFetchPosts';

// export interface PostsState {
//   threads: Thread[];
//   loading: boolean;
//   error: string | null;
//   selectedThreadId: number | null;
//   selectedUserId: number | null;
// }

// const initialState: PostsState = {
//   threads: [],
//   loading: false,
//   error: null,
//   selectedThreadId: null,
//   selectedUserId: null,
// };

// const postsSlice = createSlice({
//   name: 'posts',
//   initialState,
//   reducers: {
//     setThreads: (state, action: PayloadAction<Thread[]>) => {
//       state.threads = action.payload;
//     },
//     addNewThread: (state, action: PayloadAction<Thread>) => {
//       // Add new thread to the beginning of the array
//       state.threads.unshift(action.payload);
//     },
//     updateThreadLikeStatus: (state, action: PayloadAction<{ threadId: number; isLiked: boolean; likesCount: number }>) => {
//       const { threadId, isLiked, likesCount } = action.payload;
//       const thread = state.threads.find(t => t.id === threadId);
//       if (thread) {
//         thread.isLiked = isLiked;
//         thread.likes = likesCount;
//       }
//     },
//     updateThreadReplyCount: (state, action: PayloadAction<{ threadId: number; increment: number }>) => {
//       const { threadId, increment } = action.payload;
//       const thread = state.threads.find(t => t.id === threadId);
//       if (thread) {
//         thread.reply += increment;
//       }
//     },
//     selectThread: (state, action: PayloadAction<number>) => {
//       state.selectedThreadId = action.payload;
//     },
//     deselectThread: (state) => {
//       state.selectedThreadId = null;
//     },
//     selectUser: (state, action: PayloadAction<number>) => {
//       state.selectedUserId = action.payload;
//     },
//     deselectUser: (state) => {
//       state.selectedUserId = null;
//     },
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       state.loading = action.payload;
//     },
//     setError: (state, action: PayloadAction<string | null>) => {
//       state.error = action.payload;
//     },
//   },
// });

// export const { setThreads, addNewThread, updateThreadLikeStatus, updateThreadReplyCount, selectThread, deselectThread, selectUser, deselectUser, setLoading, setError } = postsSlice.actions;

// export const postsReducer = postsSlice.reducer;
