import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Task, Partner, UserProfile } from '../types';

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addPartner: (partner: Omit<Partner, 'id'>) => string;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setAccentColor: (color: string) => void;
}

const defaultState: AppState = {
  tasks: [
    { id: '1', title: 'Reel de Lanzamiento', description: 'Video 60s para TikTok e IG', partnerId: 'p1', status: 'Producción', dueDate: '2026-03-22', value: 1500 },
    { id: '2', title: 'Mención en YouTube', description: 'Integración de 30s', partnerId: 'p2', status: 'En Negociación', dueDate: '2026-04-05', value: 2000 },
    { id: '3', title: 'Post Carrusel', description: 'Fotos de producto', partnerId: 'p1', status: 'Revisión', dueDate: '2026-03-20', value: 800 },
  ],
  partners: [
    { id: 'p1', name: 'TechBrand', status: 'Activo', contacts: [{ id: 'c1', name: 'Laura Gómez', role: 'PR Manager', email: 'laura@techbrand.com', ig: '@laurapr' }] },
    { id: 'p2', name: 'FitLife', status: 'En Negociación', contacts: [] },
  ],
  profile: {
    name: 'Alex Creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    handle: '@alexcreator',
    goals: ['Llegar a 1M en TikTok', 'Cerrar 5 contratos a largo plazo', 'Lanzar mi propio merch'],
  },
  accentColor: '#8b5cf6', // Violet
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', state.accentColor);
  }, [state.accentColor]);

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: crypto.randomUUID() };
    setState(s => ({ ...s, tasks: [...s.tasks, newTask] }));
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    }));
  };

  const addPartner = (partner: Omit<Partner, 'id'>) => {
    const newPartner = { ...partner, id: crypto.randomUUID() };
    setState(s => ({ ...s, partners: [...s.partners, newPartner] }));
    return newPartner.id;
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...profile } }));
  };

  const setAccentColor = (color: string) => {
    setState(s => ({ ...s, accentColor: color }));
  };

  return (
    <AppContext.Provider value={{ ...state, addTask, updateTaskStatus, addPartner, updateProfile, setAccentColor }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
