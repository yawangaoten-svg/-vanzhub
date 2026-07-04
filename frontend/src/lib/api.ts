import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );

          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: { email: string; username: string; displayName: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  enable2FA: () => api.post('/auth/enable-2fa'),
  verify2FA: (token: string) => api.post('/auth/verify-2fa', { token }),
  disable2FA: () => api.post('/auth/disable-2fa'),
};

export const userApi = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.patch(`/users/${id}`, data),
  search: (q: string, page?: number) =>
    api.get('/users', { params: { q, page } }),
  getSuggestions: () => api.get('/users/suggestions'),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.post(`/users/${id}/unfollow`),
  getFollowers: (id: string, page?: number) =>
    api.get(`/users/${id}/followers`, { params: { page } }),
  getFollowing: (id: string, page?: number) =>
    api.get(`/users/${id}/following`, { params: { page } }),
  sendFriendRequest: (id: string) =>
    api.post(`/users/${id}/friend-request`),
  acceptFriendRequest: (id: string) =>
    api.post(`/users/${id}/accept-friend`),
  removeFriend: (id: string) =>
    api.post(`/users/${id}/remove-friend`),
  getFriends: (id: string) => api.get(`/users/${id}/friends`),
  updateAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateCover: (formData: FormData) =>
    api.post('/users/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUserPosts: (id: string, page?: number) =>
    api.get(`/users/${id}/posts`, { params: { page } }),
  getUserMedia: (id: string) => api.get(`/users/${id}/media`),
};

export const postApi = {
  getFeed: (page?: number) => api.get('/posts/feed', { params: { page } }),
  createPost: (data: any) => api.post('/posts', data),
  getPost: (id: string) => api.get(`/posts/${id}`),
  updatePost: (id: string, data: any) => api.patch(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  getDrafts: () => api.get('/posts/drafts'),
  toggleReaction: (id: string, type: string) =>
    api.post(`/posts/${id}/like`, { type }),
  toggleBookmark: (id: string) => api.post(`/posts/${id}/bookmark`),
  getComments: (id: string, page?: number) =>
    api.get(`/posts/${id}/comments`, { params: { page } }),
  createComment: (id: string, data: any) =>
    api.post(`/posts/${id}/comments`, data),
  deleteComment: (commentId: string) =>
    api.delete(`/posts/comments/${commentId}`),
  getTrending: () => api.get('/posts/trending'),
};

export const mediaApi = {
  upload: (formData: FormData) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultiple: (formData: FormData) =>
    api.post('/media/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadVideo: (formData: FormData) =>
    api.post('/media/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUserMedia: () => api.get('/media'),
  deleteMedia: (id: string) => api.delete(`/media/${id}`),
};

export const messageApi = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: string, page?: number) =>
    api.get(`/messages/${userId}`, { params: { page } }),
  sendMessage: (data: any) => api.post('/messages', data),
  deleteMessage: (id: string) => api.delete(`/messages/${id}`),
  markAsRead: (id: string) => api.post(`/messages/${id}/read`),
};

export const notificationApi = {
  getNotifications: (page?: number) =>
    api.get('/notifications', { params: { page } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
  searchUsers: (q: string, page?: number) =>
    api.get('/search/users', { params: { q, page } }),
  searchPosts: (q: string, page?: number) =>
    api.get('/search/posts', { params: { q, page } }),
  searchHashtags: (q: string) =>
    api.get('/search/hashtags', { params: { q } }),
  searchPhotos: (page?: number) =>
    api.get('/search/photos', { params: { page } }),
  searchVideos: (page?: number) =>
    api.get('/search/videos', { params: { page } }),
  searchGroups: (q: string) => api.get('/search/groups', { params: { q } }),
};

export const groupApi = {
  create: (data: any) => api.post('/groups', data),
  getGroups: (page?: number) => api.get('/groups', { params: { page } }),
  getMyGroups: () => api.get('/groups', { params: { mine: true } }),
  getGroup: (id: string) => api.get(`/groups/${id}`),
  updateGroup: (id: string, data: any) => api.patch(`/groups/${id}`, data),
  deleteGroup: (id: string) => api.delete(`/groups/${id}`),
  joinGroup: (id: string) => api.post(`/groups/${id}/join`),
  leaveGroup: (id: string) => api.post(`/groups/${id}/leave`),
  addMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members/${userId}`),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  updateMemberRole: (groupId: string, userId: string, role: string) =>
    api.patch(`/groups/${groupId}/members/${userId}/role`, { role }),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (page?: number) => api.get('/admin/users', { params: { page } }),
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  getReports: (page?: number) => api.get('/admin/reports', { params: { page } }),
  updateReportStatus: (reportId: string, status: string) =>
    api.patch(`/admin/reports/${reportId}`, { status }),
  getAnalytics: () => api.get('/admin/analytics'),
  getActivityLogs: (page?: number) =>
    api.get('/admin/activity-logs', { params: { page } }),
};
