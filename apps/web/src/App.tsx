/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  Settings as SettingsIcon,
  User,
  Users,
} from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import Dashboard from './views/Dashboard';
import Pipeline from './views/Pipeline';
import Directory from './views/Directory';
import Profile from './views/Profile';
import Settings from './views/Settings';
import AIAssistant from './components/AIAssistant';
import OnboardingTour from './components/OnboardingTour';
import { SurfaceCard, cx } from './components/ui';

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
    description: 'Resumen general del pipeline, partners y entregables.',
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
    description: 'Organiza marcas, contactos y alcance comercial.',
    icon: Users,
  },
  {
    id: 'profile',
    label: 'Perfil',
    shortLabel: 'Perfil',
    description: 'Define identidad, objetivos y material de presentación.',
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
  todayLabel,
  tasksDueToday,
  activePartners,
}: {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  accentColor: string;
  profileName: string;
  todayLabel: string;
  tasksDueToday: number;
  activePartners: number;
}) => (
  <aside className="hidden lg:flex lg:flex-col lg:gap-5">
    <SurfaceCard className="p-6">
      <div
        className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-slate-600 dark:text-slate-200"
        style={{ backgroundColor: `${accentColor}14` }}
      >
        Tía
      </div>
      <h1 className="mt-4 text-[2rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        Workspace
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Opera entregables, partners y seguimientos con una vista clara en web y una
        experiencia compacta en móvil.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/90 px-4 py-4 dark:border-slate-700/60 dark:bg-slate-900/55">
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500 uppercase">
            Sesión
          </p>
          <p className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">
            {profileName}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CalendarDays size={14} />
            <span>{todayLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-4 dark:border-slate-700/60 dark:bg-slate-900/45">
            <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
              Hoy
            </p>
            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {tasksDueToday}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">entregas activas</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-4 dark:border-slate-700/60 dark:bg-slate-900/45">
            <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
              Partners
            </p>
            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {activePartners}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">cuentas activas</p>
          </div>
        </div>
      </div>
    </SurfaceCard>

    <SurfaceCard className="p-3">
      <nav className="space-y-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cx(
                'w-full rounded-[1.45rem] px-4 py-4 text-left transition-all',
                isActive
                  ? 'shadow-[0_18px_30px_-24px_rgba(15,23,42,0.45)]'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/70',
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `${accentColor}14`,
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={cx(
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    isActive
                      ? 'bg-white/90 dark:bg-slate-900/60'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                  )}
                  style={isActive ? { color: accentColor } : undefined}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2.1} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tab.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {tab.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </SurfaceCard>
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
    className="fixed left-4 right-4 z-[90] flex justify-between rounded-[2rem] border border-white/55 bg-white/90 px-3 shadow-[0_22px_50px_-20px_rgba(15,23,42,0.34)] backdrop-blur-2xl transition-colors duration-300 dark:border-slate-700/40 dark:bg-slate-800/88 lg:hidden"
    style={{
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
      paddingTop: '0.7rem',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.7rem)',
    }}
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;

      return (
        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className="flex min-w-0 flex-1 justify-center"
        >
          <div
            className={cx(
              'flex w-full max-w-[68px] flex-col items-center gap-1 rounded-[1.4rem] px-2 py-2.5 transition-all',
              isActive
                ? 'shadow-[0_16px_25px_-22px_rgba(15,23,42,0.45)]'
                : 'text-slate-500 dark:text-slate-400',
            )}
            style={isActive ? { backgroundColor: `${accentColor}16`, color: accentColor } : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2.1} />
            <span
              className={cx(
                'text-[10px] font-bold tracking-wide',
                isActive ? '' : 'opacity-75',
              )}
            >
              {tab.shortLabel}
            </span>
          </div>
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
    tasks,
    partners,
    isBootstrapping,
    bootstrapError,
    actionError,
    dismissActionError,
    refreshAppData,
  } = useAppContext();

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [],
  );
  const tasksDueToday = tasks.filter(
    (task) => task.dueDate === new Date().toISOString().split('T')[0],
  ).length;
  const activePartners = partners.filter((partner) => partner.status === 'Activo').length;

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 dark:bg-slate-950">
        <SurfaceCard className="w-full max-w-lg p-8 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500 uppercase">
            Tía
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Cargando workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Estamos preparando tus datos y tus vistas de trabajo.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 dark:bg-slate-950">
        <SurfaceCard className="w-full max-w-lg p-8 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-rose-500 uppercase">Error</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            No pudimos cargar la app
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{bootstrapError}</p>
          <button
            type="button"
            onClick={() => void refreshAppData()}
            className="mt-6 w-full rounded-[1.5rem] py-3.5 text-sm font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Reintentar
          </button>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-28 right-[-6%] h-80 w-80 rounded-full blur-3xl opacity-60"
          style={{ backgroundColor: `${accentColor}22` }}
        />
        <div className="absolute bottom-0 left-[-4%] h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-500/10" />
      </div>

      <div className={cx('relative mx-auto min-h-screen', isDesktop ? 'max-w-[1600px] p-6 lg:p-7' : '')}>
        <div
          className={cx(
            isDesktop
              ? 'grid min-h-[calc(100vh-3.5rem)] grid-cols-[298px_minmax(0,1fr)] gap-5'
              : 'min-h-screen',
          )}
        >
          {isDesktop ? (
            <DesktopSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              accentColor={accentColor}
              profileName={profile.name}
              todayLabel={todayLabel}
              tasksDueToday={tasksDueToday}
              activePartners={activePartners}
            />
          ) : null}

          <main
            className={cx(
              'relative overflow-hidden transition-colors duration-300',
              isDesktop
                ? 'min-h-[calc(100vh-3.5rem)] rounded-[2.5rem] border border-white/60 bg-white/82 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.28)] dark:border-slate-700/60 dark:bg-slate-900/78'
                : 'h-[100dvh] bg-white/94 dark:bg-slate-900/96',
            )}
          >
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-72 opacity-75 transition-colors duration-700"
              style={{
                background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08, transparent)`,
              }}
            />

            {isDesktop ? (
              <div className="relative z-10 flex items-start justify-between gap-6 px-8 pt-8 pb-3">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500 uppercase">
                    Panel de trabajo
                  </p>
                  <h2 className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {activeTabConfig.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {activeTabConfig.description}
                  </p>
                </div>

                <div className="hidden items-center gap-4 rounded-[1.6rem] border border-slate-200/70 bg-white/78 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/55 xl:flex">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-12 w-12 rounded-2xl border border-white/80 object-cover dark:border-slate-700/60"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 dark:text-slate-500 uppercase">
                      Sesión
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {profile.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{todayLabel}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative z-10 flex h-full flex-col">
              <div
                className={cx('hide-scrollbar flex-1 overflow-y-auto', isDesktop ? 'pb-8' : '')}
                style={
                  isDesktop
                    ? undefined
                    : {
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8.5rem)',
                      }
                }
              >
                {actionError ? (
                  <div className={cx(isDesktop ? 'px-8 pt-1' : 'px-4 pt-1')}>
                    <div className="flex items-start gap-3 rounded-[1.6rem] border border-rose-200/80 bg-rose-50/90 px-4 py-3 dark:border-rose-500/20 dark:bg-rose-500/10">
                      <div className="flex-1">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-rose-500 uppercase">
                          Acción no completada
                        </p>
                        <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">{actionError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissActionError}
                        className="text-xs font-bold tracking-[0.14em] text-rose-500 uppercase"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className={isDesktop ? 'w-full' : 'px-0'}>{renderActiveView(activeTab)}</div>
              </div>
            </div>

            {!isDesktop ? (
              <MobileBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                accentColor={accentColor}
              />
            ) : null}

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
      {!isBootstrapping && !bootstrapError ? <OnboardingTour /> : null}
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
