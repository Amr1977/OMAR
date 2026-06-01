const API_BASE = '/api';

let token: string | null = null;

export const setToken = (t: string | null) => {
  token = t;
};

export const getToken = () => token;

export const api = {
  async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

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

  get<T = any>(path: string) {
    return this.request<T>(path);
  },

  post<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
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
  },

  // Profile
  profile: {
    create: (data: any) => api.post('/profiles', data),
    getMy: () => api.get('/profiles/my'),
    get: (id: string) => api.get(`/profiles/${id}`),
    update: (id: string, data: any) => api.put(`/profiles/${id}`, data),
    delete: (id: string) => api.delete(`/profiles/${id}`),
    submit: (id: string) => api.post(`/profiles/${id}/submit`),
    uploadPhoto: (id: string, data: any) => api.post(`/profiles/${id}/photos`, data),
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

  // Admin
  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    users: (params?: string) => api.get(`/admin/users${params ? `?${params}` : ''}`),
    banUser: (id: string) => api.put(`/admin/users/${id}/ban`),
    verifyUser: (id: string) => api.put(`/admin/users/${id}/verify`),
    pendingProfiles: () => api.get('/admin/profiles/pending'),
    approveProfile: (id: string) => api.put(`/admin/profiles/${id}/approve`),
    rejectProfile: (id: string) => api.put(`/admin/profiles/${id}/reject`),
    reports: () => api.get('/admin/reports'),
    resolveReport: (id: string) => api.put(`/admin/reports/${id}/resolve`),
    logs: (params?: string) => api.get(`/admin/logs${params ? `?${params}` : ''}`),
  },
};
