'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PREDEFINED_USERS } from '@/lib/firebase/database';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('evolvenet-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Could not parse user from sessionStorage', error);
      sessionStorage.removeItem('evolvenet-user');
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const validUser = PREDEFINED_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (validUser) {
      const userToStore: User = { id: validUser.id, username: validUser.username };
      setUser(userToStore);
      sessionStorage.setItem('evolvenet-user', JSON.stringify(userToStore));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('evolvenet-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
