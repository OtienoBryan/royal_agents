import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name: string;
  type: 'agent' | 'agency';
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set: (arg0: { accessToken: any; user: any; isAuthenticated: boolean; }) => any) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken: any, user: any) => set({ accessToken, user, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
