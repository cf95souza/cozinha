import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch | null) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('@CozinhaPlus:user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('@CozinhaPlus:token');
  });
  
  const [activeBranch, setActiveBranch] = useState<Branch | null>(() => {
    const storedBranch = localStorage.getItem('@CozinhaPlus:branch');
    return storedBranch ? JSON.parse(storedBranch) : null;
  });

  const handleSetActiveBranch = (branch: Branch | null) => {
    if (branch) {
      localStorage.setItem('@CozinhaPlus:branch', JSON.stringify(branch));
    } else {
      localStorage.removeItem('@CozinhaPlus:branch');
    }
    setActiveBranch(branch);
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('@CozinhaPlus:token', newToken);
    localStorage.setItem('@CozinhaPlus:user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('@CozinhaPlus:token');
    localStorage.removeItem('@CozinhaPlus:user');
    setToken(null);
    setUser(null);
    setActiveBranch(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, activeBranch, setActiveBranch: handleSetActiveBranch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
