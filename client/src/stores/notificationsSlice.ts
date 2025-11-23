import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../lib/api';

export interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'comment_like';
  message: string;
  is_read: boolean;
  related_id: number;
  created_at: string;
  user?: {
    username: string;
    name: string;
    profilePicture: string;
  };
}

interface NotificationsState {
  list: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: NotificationsState = {
  list: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number }) => {
    const response = await api.get('/notifications', { params: { page, limit } });
    return response.data.data;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number) => {
    const response = await api.put(`/notifications/read/${notificationId}`);
    return { notificationId };
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const response = await api.put('/notifications/read-all');
    return response;
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: number) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return { notificationId };
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.list.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
    clearNotifications: (state) => {
      state.list = [];
      state.unreadCount = 0;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, pagination, unreadCount } = action.payload;

        // Merge new notifications with existing ones
        const existingIds = new Set(state.list.map(n => n.id));
        const newNotifications = notifications.filter((n: Notification) => !existingIds.has(n.id));

        if (pagination.page === 1) {
          state.list = [...newNotifications, ...state.list];
        } else {
          state.list = [...state.list, ...newNotifications];
        }

        state.pagination = pagination;

        state.unreadCount = unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.list.find(n => n.id === action.payload.notificationId);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.list.forEach(n => n.is_read = true);
        state.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.list.find(n => n.id === action.payload.notificationId);
        if (notification && !notification.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.list = state.list.filter(n => n.id !== action.payload.notificationId);
      });
  }
});

export const { addNotification, clearNotifications, setUnreadCount } = notificationsSlice.actions;
export default notificationsSlice.reducer;
