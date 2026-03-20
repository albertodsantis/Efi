/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Home, LayoutDashboard, Users, User, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Pipeline from './views/Pipeline';
import Directory from './views/Directory';
import Profile from './views/Profile';
import Settings from './views/Settings';
import AIAssistant from './components/AIAssistant';
import OnboardingTour from './components/OnboardingTour';

type TabId = 'dashboard' | 'pipeline' | 'directory' | 'profile' | 'settings';

const tabs: Array<{
  id: TabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}> = [
  {
    id: 'dashboard',
    label: 'Inicio',
    shortLabel: 'Inicio',
    description: 'Vision general del pipeline, partners y entregables.',
    icon: Home,
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    shortLabel: 'Pipeline',
    description: 'Gestiona tareas, estados y calendario comercial.',
    icon: LayoutDashboard,
  },
  {
    id: 'directory',
    label: 'Directorio',
    shortLabel: 'Directorio',
    description: 'Ordena marcas, contactos y outreach comercial.',
    icon: Users,
  },
  {
    id: 'profile',
    label: 'Perfil',
    shortLabel: 'Perfil',
    description: 'Ajusta identidad, objetivos y material comercial.',
    icon: User,
  },
  {
    id: 'settings',
    label: 'Ajustes',
    shortLabel: 'Ajustes',
    description: 'Tema, plantillas, notificaciones e integraciones.',
    icon: SettingsIcon,
  },
];

function useIsDesktop() {
  const getInitialValue = () =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  const [isDesktop, setIsDesktop] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isDesktop;
}

function renderActiveView(activeTab: TabId) {
  if (activeTab === 'dashboard') {
    return <Dashboard />;
  }

  if (activeTab === 'pipeline') {
    return <Pipeline />;
  }

  if (activeTab === 'directory') {
    return <Directory />;
  }

  if (activeTab === 'profile') {
    return <Profile />;
  }

  return <Settings />;
}

const DesktopSidebar = ({
  activeTab,
  onTabChange,
  accentColor,
  profileName,
}: {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  accentColor: string;
  profileName: string;
}) => (
  <aside className="hidden lg:flex lg:flex-col lg:gap-6">
    <div className="rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
        Tía
      </p>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        Workspace
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Un CRM ligero para creators, pensado para operar mejor desde web y moverse
        con soltura en mobile.
      </p>
      <div
        className="mt-6 rounded-[1.5rem] px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200"
        style={{ backgroundColor: `${accentColor}14` }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Sesion activa
        </p>
        <p className="mt-2 text-base">{profileName}</p>
      </div>
    </div>

    <nav className="rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] p-4">
      <div className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`w-full rounded-[1.5rem] px-4 py-4 text-left transition-all ${
                isActive
                  ? 'shadow-[0_18px_30px_-20px_rgba(15,23,42,0.65)]'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/70'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isActive
                      ? 'bg-white/80 dark:bg-slate-900/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2.1} />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      isActive
                        ? ''
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {tab.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tab.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  </aside>
);

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  accentColor,
}: {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  accentColor: string;
}) => (
  <div
    className="fixed left-4 right-4 bg-white/82 dark:bg-slate-800/84 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 flex justify-around px-4 z-[90] rounded-[2rem] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] transition-colors duration-300 lg:hidden"
    style={{
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
      paddingTop: '0.9rem',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.9rem)',
    }}
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center justify-center w-14 gap-1.5 transition-all duration-300 active:scale-90 relative ${
            isActive ? '' : 'text-slate-500 dark:text-slate-400'
          }`}
          style={isActive ? { color: accentColor } : {}}
        >
          {isActive && (
            <div
              className="absolute -top-3 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <Icon
            size={24}
            strokeWidth={isActive ? 2.5 : 2}
            className={isActive ? 'transform -translate-y-0.5 transition-transform' : 'transition-transform'}
          />
          <span className="text-[10px] font-bold tracking-wide">{tab.shortLabel}</span>
        </button>
      );
    })}
  </div>
);

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const isDesktop = useIsDesktop();
  const {
    accentColor,
    profile,
    isBootstrapping,
    bootstrapError,
    actionError,
    dismissActionError,
    refreshAppData,
  } = useAppContext();

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(15,23,42,0.28)] p-8 text-center border border-white/60 dark:border-slate-700/60">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">
            Tía
          </p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Cargando workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Estamos trayendo tus datos desde el backend.
          </p>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(15,23,42,0.28)] p-8 text-center border border-white/60 dark:border-slate-700/60">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500 mb-3">
            Error
          </p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            No pudimos cargar la app
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{bootstrapError}</p>
          <button
            onClick={() => void refreshAppData()}
            className="w-full py-3 rounded-2xl font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 right-[-10%] h-80 w-80 rounded-full blur-3xl opacity-50"
          style={{ backgroundColor: `${accentColor}2A` }}
        />
        <div className="absolute bottom-0 left-[-5%] h-72 w-72 rounded-full bg-cyan-200/30 dark:bg-cyan-500/10 blur-3xl" />
      </div>

      <div className={`relative mx-auto min-h-screen ${isDesktop ? 'max-w-[1600px] p-6 lg:p-8' : ''}`}>
        <div className={isDesktop ? 'grid min-h-[calc(100vh-4rem)] grid-cols-[280px_minmax(0,1fr)] gap-6' : 'min-h-screen'}>
          {isDesktop && (
            <DesktopSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              accentColor={accentColor}
              profileName={profile.name}
            />
          )}

          <main
            className={`relative overflow-hidden transition-colors duration-300 ${
              isDesktop
                ? 'min-h-[calc(100vh-4rem)] rounded-[2.5rem] border border-white/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.28)]'
                : 'h-[100dvh] bg-white/92 dark:bg-slate-900/96'
            }`}
          >
            <div
              className="absolute top-0 left-0 right-0 h-80 opacity-70 pointer-events-none transition-colors duration-700"
              style={{
                background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08, transparent)`,
              }}
            />

            {isDesktop && (
              <div className="relative z-10 flex items-start justify-between gap-6 px-8 pt-8 pb-2">
                <div className="max-w-xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Vista Web
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {activeTabConfig.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {activeTabConfig.description}
                  </p>
                </div>
                <div className="hidden xl:flex items-center gap-4 rounded-[1.5rem] border border-white/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 px-4 py-3 backdrop-blur-xl">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-11 w-11 rounded-2xl object-cover border border-white/70 dark:border-slate-700/60"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      Creator
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {profile.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-10 flex h-full flex-col">
              <div
                className={`flex-1 overflow-y-auto hide-scrollbar ${isDesktop ? 'pb-10' : ''}`}
                style={
                  isDesktop
                    ? undefined
                    : {
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8.75rem)',
                      }
                }
              >
                {actionError && (
                  <div className={`${isDesktop ? 'px-8 pt-2' : 'px-4 pt-2'}`}>
                    <div className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50/90 dark:border-rose-500/20 dark:bg-rose-500/10 px-4 py-3 flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500 mb-1">
                          Accion no completada
                        </p>
                        <p className="text-sm text-rose-700 dark:text-rose-200">{actionError}</p>
                      </div>
                      <button
                        onClick={dismissActionError}
                        className="text-xs font-bold uppercase tracking-wider text-rose-500"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                <div className={isDesktop ? 'w-full' : 'px-0'}>
                  {renderActiveView(activeTab)}
                </div>
              </div>
            </div>

            {!isDesktop && (
              <MobileBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                accentColor={accentColor}
              />
            )}

            <AIAssistant isDesktop={isDesktop} />
          </main>
        </div>
      </div>
    </div>
  );
};

const AppShell = () => {
  const { isBootstrapping, bootstrapError } = useAppContext();

  return (
    <>
      {!isBootstrapping && !bootstrapError && <OnboardingTour />}
      <MainLayout />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
