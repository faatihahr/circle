import { createSlice } from '@reduxjs/toolkit';

export interface FollowStatusMap {
  [userId: number]: boolean; // userId -> isFollowing
}

export interface FollowState {
  followStatuses: FollowStatusMap;
  loading: boolean;
  error: string | null;
}

const initialState: FollowState = {
  followStatuses: {},
  loading: false,
  error: null,
};

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    // Update follow status for a specific user
    updateFollowStatus: (state, action: { payload: { userId: number; isFollowing: boolean } }) => {
      const { userId, isFollowing } = action.payload;
      state.followStatuses[userId] = isFollowing;
    },

    // Bulk update multiple follow statuses at once
    updateMultipleFollowStatuses: (state, action: { payload: FollowStatusMap }) => {
      state.followStatuses = { ...state.followStatuses, ...action.payload };
    },

    // Clear all follow statuses (useful for logout)
    clearFollowStatuses: (state) => {
      state.followStatuses = {};
    },

    // Set loading state
    setLoading: (state, action: { payload: boolean }) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action: { payload: string | null }) => {
      state.error = action.payload;
    },
  },
});

export const {
  updateFollowStatus,
  updateMultipleFollowStatuses,
  clearFollowStatuses,
  setLoading,
  setError
} = followSlice.actions;

export default followSlice.reducer;
