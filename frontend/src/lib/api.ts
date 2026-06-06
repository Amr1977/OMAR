const API_BASE = import.meta.env.VITE_API_URL || '/api';
const PHOTO_BASE = API_BASE.replace(/\/api\/?$/, '');

export const photoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${PHOTO_BASE}${url}`;
  if (url.startsWith('data:')) return url;
  return url;
};

let token: string | null = null;

export const setToken = (t: string | null) => {
  token = t;
};

export const getToken = () => token;

export const api = {
  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.messageEn || 'Request failed');
    }

    return data;
  },

  async upload<T = any>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: formData,
    });
  },

  get<T = any>(path: string) {
    return this.request<T>(path);
  },

  post<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  },

  // Auth
  auth: {
    register: (data: any) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
    logout: () => api.post('/auth/logout'),
    updateModules: (modules: string[]) => api.put('/auth/modules', { modules }),
  },

  // Profile
  profile: {
    create: (data: any) => api.post('/profiles', data),
    getMy: () => api.get('/profiles/my'),
    get: (id: string) => api.get(`/profiles/${id}`),
    update: (id: string, data: any) => api.put(`/profiles/${id}`, data),
    delete: (id: string) => api.delete(`/profiles/${id}`),
    submit: (id: string) => api.post(`/profiles/${id}/submit`),
    toggleVisibility: (id: string, visible: boolean) => api.put(`/profiles/${id}/visibility`, { visible }),
    uploadPhoto: (id: string, formData: FormData) => api.upload(`/profiles/${id}/photos`, formData),
    setPrimaryPhoto: (profileId: string, photoId: string) =>
      api.put(`/profiles/${profileId}/photos/${photoId}/primary`),
    deletePhoto: (profileId: string, photoId: string) =>
      api.delete(`/profiles/${profileId}/photos/${photoId}`),
  },

  // Browse
  browse: {
    profiles: (params?: string) => api.get(`/browse/profiles${params ? `?${params}` : ''}`),
    get: (id: string) => api.get(`/browse/profiles/${id}`),
    aiSuggestions: (params?: string) =>
      api.get(`/browse/ai-suggestions${params ? `?${params}` : ''}`),
  },

  // Requests
  requests: {
    send: (data: any) => api.post('/requests', data),
    sent: () => api.get('/requests/sent'),
    received: () => api.get('/requests/received'),
    accept: (id: string) => api.put(`/requests/${id}/accept`),
    reject: (id: string) => api.put(`/requests/${id}/reject`),
  },

  // Messages
  messages: {
    conversations: () => api.get('/messages/conversations'),
    getConversation: (id: string) => api.get(`/messages/conversations/${id}`),
    send: (id: string, content: string) =>
      api.post(`/messages/conversations/${id}`, { content }),
    markRead: (id: string) => api.put(`/messages/conversations/${id}/read`),
  },

  // Notifications
  notifications: {
    list: () => api.get('/notifications'),
    markAllRead: () => api.put('/notifications/read-all'),
    markRead: (id: string) => api.put(`/notifications/${id}/read`),
  },

  // Payments
  payments: {
    plans: () => api.get('/payments/plans'),
    createCheckout: (planId: string) => api.post('/payments/create-checkout', { planId }),
  },

  // Social
  social: {
    createPost: (data: any) => api.post('/social/posts', data),
    updatePost: (id: string, data: any) => api.put(`/social/posts/${id}`, data),
    uploadMedia: (formData: FormData) => api.upload('/social/posts/media', formData),
    getFeed: (params?: string) => api.get(`/social/feed${params ? `?${params}` : ''}`),
    getExplore: (params?: string) => api.get(`/social/explore${params ? `?${params}` : ''}`),
    getPost: (id: string) => api.get(`/social/posts/${id}`),
    deletePost: (id: string) => api.delete(`/social/posts/${id}`),
    toggleLike: (id: string) => api.post(`/social/posts/${id}/like`),
    addComment: (id: string, content: string) => api.post(`/social/posts/${id}/comments`, { content }),
    deleteComment: (postId: string, commentId: string) => api.delete(`/social/posts/${postId}/comments/${commentId}`),
    toggleFollow: (userId: string) => api.post(`/social/follow/${userId}`),
    getFollowers: (userId?: string) => api.get(userId ? `/social/followers/${userId}` : '/social/followers'),
    getFollowing: (userId?: string) => api.get(userId ? `/social/following/${userId}` : '/social/following'),
    getUserPosts: (userId: string, params?: string) => api.get(`/social/user/${userId}/posts${params ? `?${params}` : ''}`),
    sharePost: (postId: string, content?: string) => api.post(`/social/posts/${postId}/share`, { content }),
    getReputation: (userId?: string) => api.get(userId ? `/social/user/${userId}/reputation` : '/social/reputation'),
  },

  // Admin
  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    users: (params?: string) => api.get(`/admin/users${params ? `?${params}` : ''}`),
    banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
    verifyUser: (id: string) => api.put(`/admin/users/${id}/verify`),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    pendingProfiles: () => api.get('/admin/profiles/pending'),
    approveProfile: (id: string) => api.put(`/admin/profiles/${id}/approve`),
    rejectProfile: (id: string) => api.put(`/admin/profiles/${id}/reject`),
    reports: () => api.get('/admin/reports'),
    resolveReport: (id: string) => api.put(`/admin/reports/${id}/resolve`),
    logs: (params?: string) => api.get(`/admin/logs${params ? `?${params}` : ''}`),
    posts: (params?: string) => api.get(`/admin/posts${params ? `?${params}` : ''}`),
    deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
    conversations: (params?: string) => api.get(`/admin/conversations${params ? `?${params}` : ''}`),
    feedback: (params?: string) => api.get(`/admin/feedback${params ? `?${params}` : ''}`),
    approveFeedback: (id: string) => api.put(`/admin/feedback/${id}/approve`),
    rejectFeedback: (id: string) => api.put(`/admin/feedback/${id}/reject`),
    deleteFeedback: (id: string) => api.delete(`/admin/feedback/${id}`),
    subscriptions: () => api.get('/admin/subscriptions'),
    verifySubscription: (id: string) => api.put(`/admin/subscriptions/${id}/verify`),
    declineSubscription: (id: string, adminNote?: string) => api.put(`/admin/subscriptions/${id}/decline`, { adminNote }),
    donations: () => api.get('/admin/donations'),
    verifyDonation: (id: string) => api.put(`/admin/donations/${id}/verify`),
    declineDonation: (id: string, adminNote?: string) => api.put(`/admin/donations/${id}/decline`, { adminNote }),
  },

  // Feedback
  feedback: {
    submit: (data: any) => api.post('/feedback', data),
    testimonials: () => api.get('/feedback/testimonials'),
  },

  // Subscriptions
  subscriptions: {
    create: (data: any) => api.post('/subscriptions', data),
    getMy: () => api.get('/subscriptions/my'),
  },

  // Donations
  donations: {
    create: (data: any) => api.post('/donations', data),
  },

  // Brides
  brides: {
    create: (data: any) => api.post('/brides', data),
    list: () => api.get('/brides'),
    get: (id: string) => api.get(`/brides/${id}`),
    update: (id: string, data: any) => api.put(`/brides/${id}`, data),
    delete: (id: string) => api.delete(`/brides/${id}`),
  },

  // Services
  services: {
    categories: () => api.get('/services/categories'),
    list: (params?: string) => api.get(`/services${params ? `?${params}` : ''}`),
    my: () => api.get('/services/my'),
    get: (id: string) => api.get(`/services/${id}`),
    create: (data: any) => api.post('/services', data),
    update: (id: string, data: any) => api.put(`/services/${id}`, data),
    delete: (id: string) => api.delete(`/services/${id}`),
    book: (id: string, message?: string) => api.post(`/services/${id}/book`, { message }),
    bookings: () => api.get('/services/bookings'),
    updateBooking: (id: string, status: string) => api.put(`/services/bookings/${id}`, { status }),
    addReview: (id: string, rating: number, content?: string) => api.post(`/services/${id}/reviews`, { rating, content }),
  },
};
