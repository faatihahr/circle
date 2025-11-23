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

  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  getProfileById: async (id: string) => {
    const response = await api.get(`/user/profile/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/user/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProfile: async (data: { name?: string; bio?: string; profilePicture?: string; image_headers?: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/user/users');
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

  // UPDATE: Support cursor dan limit untuk pagination
  getAllPosts: async (cursor?: number, limit?: number) => {
    let url = '/posts'; 
    const params: string[] = [];
    
    if (cursor !== undefined && cursor !== null) params.push(`cursor=${cursor}`);
    if (limit !== undefined) params.push(`limit=${limit}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    const response = await api.get(url);
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

  getPostsByUserId: async (id: string) => {
    const response = await api.get(`/posts/user/${id}`);
    return response.data;
  },

  toggleLike: async (id: string) => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },
};


// Comments API functions
export const commentsAPI = {
  createComment: async (data: { threadId: string; userId: string; content: string; parentId?: string; image?: File }) => {
    const formData = new FormData();
    formData.append('thread_id', data.threadId);
    formData.append('user_id', data.userId);
    formData.append('content', data.content);
    if (data.parentId) formData.append('parent_id', data.parentId);
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

  toggleCommentLike: async (commentId: string) => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },
};

// Follow API functions
export const followAPI = {
  followUser: async (id: string) => {
    const response = await api.post(`/follow/${id}/follow`);
    return response.data;
  },

  unfollowUser: async (id: string) => {
    const response = await api.delete(`/follow/${id}/unfollow`);
    return response.data;
  },

  getFollowStatus: async (id: string) => {
    const response = await api.get(`/follow/${id}/status`);
    return response.data;
  },

  getFollowers: async (id: string) => {
    const response = await api.get(`/follow/${id}/followers`);
    return response.data;
  },

  getFollowing: async (id: string) => {
    const response = await api.get(`/follow/${id}/following`);
    return response.data;
  },
};

// Search API functions
export const searchAPI = {
  searchUsers: async (query: string) => {
    const response = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  searchPosts: async (query: string) => {
    const response = await api.get(`/search/posts?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  searchAll: async (query: string) => {
    const response = await api.get(`/search/all?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
