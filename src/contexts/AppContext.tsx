import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AcademicYear, SchoolSettings } from '../types';
import { authService, DEFAULT_USERS } from '../services/authService';
import { storageService } from '../services/storageService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  currentUser: UserProfile;
  switchUserRole: (role: UserRole) => void;
  activeAcademicYear: AcademicYear | null;
  academicYears: AcademicYear[];
  setActiveAcademicYearId: (id: string) => void;
  schoolSettings: SchoolSettings | null;
  refreshData: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('msts_theme') as 'light' | 'dark') || 'light';
  });

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('msts_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const refreshData = async () => {
    try {
      const settings = await storageService.getSettings();
      setSchoolSettings(settings);

      const years = await storageService.getAcademicYears();
      setAcademicYears(years);

      const active = years.find((y) => y.academicYearId === settings.academicYearActiveId) || years[0] || null;
      setActiveAcademicYear(active);
    } catch (err) {
      console.error('Failed to load initial school data', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const switchUserRole = (role: UserRole) => {
    const updated = authService.switchRole(role);
    setCurrentUser(updated);
    addToast('info', 'បានប្តូរតួនាទីអ្នកប្រើប្រាស់', `ប្តូរទៅកាន់៖ ${updated.displayName} (${role})`);
  };

  const setActiveAcademicYearId = async (id: string) => {
    const matched = academicYears.find((y) => y.academicYearId === id);
    if (matched && schoolSettings) {
      const updatedSettings = { ...schoolSettings, academicYearActiveId: id };
      await storageService.updateSettings(updatedSettings);
      setSchoolSettings(updatedSettings);
      setActiveAcademicYear(matched);
      addToast('success', 'បានជ្រើសរើសឆ្នាំសិក្សា', matched.yearName);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUserRole,
        activeAcademicYear,
        academicYears,
        setActiveAcademicYearId,
        schoolSettings,
        refreshData,
        toasts,
        addToast,
        removeToast,
        theme,
        toggleTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

