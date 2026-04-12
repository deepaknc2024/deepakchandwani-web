import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  hasGoogle?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'dc_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true });
  const location = useLocation();

  // Check existing session on mount
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setState({ user: null, token: null, isLoading: false });
      return;
    }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          setState({ user: data.user, token: saved, isLoading: false });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setState({ user: null, token: null, isLoading: false });
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  // Track page visits
  useEffect(() => {
    if (!state.token || !state.user) return;

    fetch('/api/auth/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ action: 'page_visit', pageUrl: location.pathname }),
    }).catch(() => {});
  }, [location.pathname, state.token, state.user]);

  const handleAuthResponse = useCallback(async (res: Response): Promise<{ ok: boolean; error?: string }> => {
    const data = await res.json();
    if (data.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({ user: data.user, token: data.token, isLoading: false });
      return { ok: true };
    }
    return { ok: false, error: data.error || 'Authentication failed' };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleAuthResponse(res);
  }, [handleAuthResponse]);

  const signup = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    return handleAuthResponse(res);
  }, [handleAuthResponse]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    return handleAuthResponse(res);
  }, [handleAuthResponse]);

  const logout = useCallback(async () => {
    if (state.token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, isLoading: false });
  }, [state.token]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        loginWithGoogle,
        logout,
        isAuthenticated: !!state.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
