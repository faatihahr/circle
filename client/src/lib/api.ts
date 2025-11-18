import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const authAPI = {
  register: async (data: { username: string; email: string; password: string; name?: string }) => {
    const response = await api.post('/user/register', data);
    return response.data;
  },

  login: async (data: { login: string; password: string }) => {
    const response = await api.post('/user/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await api.put('/user/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    const response = await api.put('/user/reset-password', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/user/logout');
    localStorage.removeItem('token');
    return response.data;
  },
};

// Posts API functions
export const postsAPI = {
  createPost: async (data: { title?: string; content?: string; image?: File }) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);
    const response = await api.post('/posts/create', formData);
    return response.data;
  },

  getAllPosts: async () => {
    const response = await api.get('/posts');
    return response.data;
  },

  getPostById: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  updatePost: async (id: string, data: { title?: string; content?: string; image?: File }) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);
    const response = await api.put(`/posts/${id}`, formData);
    return response.data;
  },

  deletePost: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  toggleLike: async (id: string) => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },
};

// Comments API functions
export const commentsAPI = {
  createComment: async (data: { threadId?: string; content?: string; image?: File }) => {
    const formData = new FormData();
    if (data.threadId) formData.append('threadId', data.threadId);
    if (data.content) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);
    const response = await api.post('/comments/create', formData);
    return response.data;
  },

  getCommentsByThread: async (threadId: string) => {
    const response = await api.get(`/comments/threads/${threadId}`);
    return response.data;
  },

  getCommentById: async (id: string) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },

  updateComment: async (id: string, data: { content?: string; image?: File }) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.image) formData.append('image', data.image);
    const response = await api.put(`/comments/${id}`, formData);
    return response.data;
  },

  deleteComment: async (id: string) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};
