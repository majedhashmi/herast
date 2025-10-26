import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Personnel } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  user: Personnel | null;
  switchUser: (id: number) => void;
  UserSwitcher: React.FC;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple in-memory store for the selected user ID to persist across re-renders/hot-reloads
let selectedUserId: number | null = null;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Personnel | null>(null);
  // Get personnel data and loading state from the central DataProvider
  const { personnel, loading: isDataLoading } = useData();

  useEffect(() => {
    if (!isDataLoading && personnel.length > 0) {
      // If a user was previously selected, try to find them.
      let initialUser = selectedUserId ? personnel.find(p => p.id === selectedUserId) : null;
      
      // If no user was selected or the selected user no longer exists, default to the first user.
      if (!initialUser) {
        initialUser = personnel[0];
        selectedUserId = initialUser.id;
      }
      
      setUser(initialUser);
    }
  }, [isDataLoading, personnel]);

  const switchUser = (id: number) => {
    const newUser = personnel.find(p => p.id === id);
    if (newUser) {
      setUser(newUser);
      selectedUserId = id; // Persist selection
    }
  };

  const UserSwitcher = () => {
    if (isDataLoading || !user) {
      return <div className="w-48 h-10 rounded-lg skeleton-loader"></div>;
    }

    return (
      <div className="flex items-center gap-2">
          <label htmlFor="user-switcher" className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">کاربر:</label>
          <select
              id="user-switcher"
              value={user.id}
              onChange={(e) => switchUser(Number(e.target.value))}
              className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
              aria-label="تعویض کاربر"
          >
              {personnel.map(p => (
                  <option key={p.id} value={p.id}>
                      {p.name} {p.family} ({p.role})
                  </option>
              ))}
          </select>
      </div>
    );
  };
  
  const value = useMemo(() => ({ user, switchUser, UserSwitcher }), [user, personnel, isDataLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
