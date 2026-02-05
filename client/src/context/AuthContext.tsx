import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserId } from 'shared';

interface AuthContextType {
  userId: UserId | null;
  login: (id: UserId) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<UserId | null>(() => {
    const stored = localStorage.getItem('userId');
    return stored === 'A' || stored === 'B' ? stored : null;
  });

  const login = useCallback((id: UserId) => {
    localStorage.setItem('userId', id);
    setUserId(id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userId');
    setUserId(null);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
