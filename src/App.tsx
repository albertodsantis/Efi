/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Home, LayoutDashboard, Users, User, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Pipeline from './views/Pipeline';
import Directory from './views/Directory';
import Profile from './views/Profile';
import Settings from './views/Settings';

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { accentColor } = useAppContext();

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'pipeline', icon: LayoutDashboard, label: 'Pipeline' },
    { id: 'directory', icon: Users, label: 'Directorio' },
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen sm:p-4 font-sans">
      <div className="w-full max-w-md bg-gray-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" style={{ height: '100dvh', maxHeight: '900px' }}>
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar relative">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'pipeline' && <Pipeline />}
          {activeTab === 'directory' && <Directory />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'settings' && <Settings />}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around py-4 px-2 z-50 rounded-t-3xl sm:rounded-b-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center w-16 gap-1.5 transition-all duration-300 active:scale-90 relative"
                style={{ color: isActive ? accentColor : '#9ca3af' }}
              >
                {isActive && (
                  <div className="absolute -top-4 w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'transform -translate-y-1 transition-transform' : 'transition-transform'} />
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
