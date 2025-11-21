import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { authAPI } from '../lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  profilePicture?: string;
  bio?: string;
  image_headers?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface UserState {
  user: User | null;
  profile: User | null;
  viewedProfile: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  profile: null,
  viewedProfile: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'user/initializeAuth',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Validate token on app initialization
        const response = await authAPI.getProfile();
        localStorage.setItem('user', JSON.stringify(response));
        return response;
      } catch (error) {
        // Token is invalid or expired, clear stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return rejectWithValue('Token expired or invalid');
      }
    }
    return null;
  }
);

export const login = createAsyncThunk(
  'user/login',
  async (data: { login: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(data);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'user/register',
  async (data: { username: string; email: string; password: string; name?: string }) => {
    const response = await authAPI.register(data);
    return response;
  }
);

export const forgotPassword = createAsyncThunk(
  'user/forgotPassword',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Forgot password failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async (data: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Reset password failed');
    }
  }
);

export const logout = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
);

export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfile();
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: { name?: string; bio?: string; profilePicture?: string; image_headers?: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(data);
      // Fetch updated profile to ensure state is updated with latest data
      const updatedProfile = await authAPI.getProfile();
      return updatedProfile;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const getProfileById = createAsyncThunk(
  'user/getProfileById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfileById(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFollowerCounts: (state, action) => {
      const { userId, followingDelta, followersDelta } = action.payload;
      // Update current user's following count if it matches
      if (state.user && state.user.id === userId) {
        state.user.followingCount = (state.user.followingCount || 0) + followingDelta;
      }
      if (state.profile && state.profile.id === userId) {
        state.profile.followingCount = (state.profile.followingCount || 0) + followingDelta;
      }
      // Update viewed profile's follower count if it matches
      if (state.viewedProfile && state.viewedProfile.id === userId) {
        state.viewedProfile.followersCount = (state.viewedProfile.followersCount || 0) + followersDelta;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = localStorage.getItem('token') ? true : false;
        // state.isAuthenticated = !!action.payload;
        state.loading = false;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Registration successful, user needs to login
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Handle success message if needed
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Handle success message if needed
      })
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.viewedProfile = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.user = action.payload; // Update current user data to reflect changes
        localStorage.setItem('user', JSON.stringify(action.payload)); // Update stored user data
        state.loading = false;
        state.error = null;
      })
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
        state.loading = false;
        state.error = null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getProfileById.fulfilled, (state, action) => {
        state.viewedProfile = action.payload;
      });
  },
});

export const updateFollowerCounts = createAction<{
  userId: string;
  followingDelta: number;
  followersDelta: number;
}>('user/updateFollowerCounts');

export const { clearError } = userSlice.actions;
export const userActions = { login, register, forgotPassword, resetPassword, logout, initializeAuth, getProfile, updateProfile, getProfileById, updateFollowerCounts };

export default userSlice.reducer;
