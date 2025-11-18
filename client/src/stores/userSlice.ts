import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  profile_picture?: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'user/initializeAuth',
  async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user as User | null;
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

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.loading = false;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
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
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = userSlice.actions;
export const userActions = { login, register, forgotPassword, resetPassword, logout, initializeAuth };
export default userSlice.reducer;
