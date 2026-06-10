import { create } from 'zustand';
import { api, setToken } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface User {
  id: string;
  firebaseUid: string;
  phone?: string;
  email?: string;
  roles: string[];
  isVerified: boolean;
  subscriptionPlan: string;
  subscriptionExpiry?: string;
  language: string;
  isActive: boolean;
  isBanned: boolean;
  hasProfile: boolean;
  profileId?: string;
  avatarUrl?: string | null;
  profilePhoto?: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    setToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
    connectSocket();
  },

  logout: () => {
    setToken(null);
    localStorage.removeItem('auth_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    disconnectSocket();
    api.auth.logout().catch(() => {});
    window.location.href = '/login';
  },

  fetchMe: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      setToken(token);
      const user = await api.auth.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      connectSocket();
    } catch {
      setToken(null);
      localStorage.removeItem('auth_token');
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => set({ user }),
}));
