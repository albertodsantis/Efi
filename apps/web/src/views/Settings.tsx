import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Shield,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import OverlayModal from '../components/OverlayModal';

const ACCENT_OPTIONS = [
  { name: 'Violeta', value: '#8B5CF6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Azul', value: '#2563EB' },
  { name: 'Cielo', value: '#0EA5E9' },
  { name: 'Turquesa', value: '#06B6D4' },
  { name: 'Menta', value: '#14B8A6' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Lima', value: '#84CC16' },
  { name: 'Limon', value: '#A3E635' },
  { name: 'Amarillo', value: '#EAB308' },
  { name: 'Ambar', value: '#F59E0B' },
  { name: 'Naranja', value: '#FC4C00' },
  { name: 'Coral', value: '#FB7185' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Cereza', value: '#E11D48' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Fucsia', value: '#D946EF' },
  { name: 'Pizarra', value: '#475569' },
  { name: 'Grafito', value: '#334155' },
] as const;

export default function Settings() {
  const {
    accentColor,
    setAccentColor,
    profile,
    updateProfile,
    templates,
    addTemplate,
    deleteTemplate,
    theme,
    setTheme,
  } = useAppContext();
  const [gcalConnected, setGcalConnected] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isAccentPaletteOpen, setIsAccentPaletteOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  const shellCardClass =
    'rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/78 dark:bg-slate-800/74 backdrop-blur-2xl shadow-[0_20px_60px_-26px_rgba(15,23,42,0.22)] overflow-hidden';
  const rowButtonClass =
    'w-full flex items-center justify-between gap-4 p-5 border-b border-white/60 dark:border-slate-700/50 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-700/35 active:bg-slate-50/90 dark:active:bg-slate-700/50';
  const activeAccent =
    ACCENT_OPTIONS.find((option) => option.value.toLowerCase() === accentColor.toLowerCase()) ?? {
      name: 'Actual',
      value: accentColor,
    };

  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => setGcalConnected(data.connected))
      .catch((err) => console.error('Failed to fetch gcal status', err));
  }, []);

  const toggleNotifications = async () => {
    if (!profile.notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await updateProfile({ notificationsEnabled: true });
        } else {
          alert('Debes permitir las notificaciones en tu navegador.');
        }
      } else {
        alert('Tu navegador no soporta notificaciones.');
      }
      return;
    }

    await updateProfile({ notificationsEnabled: false });
  };

  const connectGoogleCalendar = async () => {
    if (gcalConnected) {
      await fetch('/api/auth/logout', { method: 'POST' });
      setGcalConnected(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setGcalConnected(true);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleAddTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    await addTemplate(newTemplate);
    setIsAddingTemplate(false);
    setNewTemplate({ name: '', subject: '', body: '' });
  };

  return (
    <div className="p-6 lg:px-8 lg:py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:hidden max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          Configuracion
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Ajustes del workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Ajusta el tema, la sincronizacion y las plantillas que usas cada dia.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <h2 className="ml-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Tema de la app
          </h2>
          <div className={shellCardClass}>
            <button
              type="button"
              onClick={() => setIsAccentPaletteOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isAccentPaletteOpen}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Color activo
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className="block h-11 w-11 rounded-full border-4 border-white shadow-sm dark:border-slate-700"
                    style={{ backgroundColor: activeAccent.value }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {activeAccent.name}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {activeAccent.value}
                    </p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {isAccentPaletteOpen ? 'Ocultar' : 'Cambiar'}
                </p>
                <ChevronDown
                  size={18}
                  className={`ml-auto mt-2 text-slate-400 transition-transform dark:text-slate-500 ${
                    isAccentPaletteOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {isAccentPaletteOpen && (
              <div className="border-t border-white/60 px-5 py-4 dark:border-slate-700/50">
                <div className="grid grid-cols-4 gap-3 min-[380px]:grid-cols-5">
                  {ACCENT_OPTIONS.map((option) => {
                    const isSelected = option.value.toLowerCase() === accentColor.toLowerCase();
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-label={`Seleccionar ${option.name}`}
                        title={option.name}
                        onClick={() => void setAccentColor(option.value)}
                        className="flex items-center justify-center py-1 transition-transform active:scale-95"
                      >
                        <span
                          className={`block h-11 w-11 rounded-full border-4 border-white shadow-sm transition-all dark:border-slate-700 ${
                            isSelected
                              ? 'scale-110 ring-2 ring-slate-900/20 dark:ring-white/20'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: option.value }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="ml-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Ajustes generales
          </h2>
          <div className={shellCardClass}>
            <button
              type="button"
              onClick={() => void setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={rowButtonClass}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo oscuro</span>
              </div>
              <div
                className={`relative h-7 w-14 rounded-full shadow-inner transition-colors ${
                  theme === 'dark' ? '' : 'bg-slate-200 dark:bg-slate-600'
                }`}
                style={theme === 'dark' ? { backgroundColor: accentColor } : {}}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                    theme === 'dark' ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={toggleNotifications}
              className={rowButtonClass}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  <Bell size={20} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Notificaciones push
                </span>
              </div>
              <div
                className={`relative h-7 w-14 rounded-full shadow-inner transition-colors ${
                  profile.notificationsEnabled ? '' : 'bg-slate-200 dark:bg-slate-600'
                }`}
                style={profile.notificationsEnabled ? { backgroundColor: accentColor } : {}}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                    profile.notificationsEnabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={connectGoogleCalendar}
              className={rowButtonClass}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  <CalendarIcon size={20} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Sincronizar Calendar
                </span>
              </div>
              <div
                className={`relative h-7 w-14 rounded-full shadow-inner transition-colors ${
                  gcalConnected ? '' : 'bg-slate-200 dark:bg-slate-600'
                }`}
                style={gcalConnected ? { backgroundColor: accentColor } : {}}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                    gcalConnected ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            <div className="flex items-center justify-between bg-white/40 p-5 dark:bg-slate-900/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  <Shield size={20} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Privacidad y seguridad
                </span>
              </div>
              <span className="text-xl font-bold text-slate-300 dark:text-slate-600">›</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between pr-2">
          <h2 className="ml-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Plantillas de mensajes
          </h2>
          <button
            onClick={() => setIsAddingTemplate(true)}
            className="text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-white"
            aria-label="Agregar plantilla"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`${shellCardClass} flex items-center justify-between p-4`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {template.name}
                  </h3>
                  <p className="max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-400 lg:max-w-[320px] xl:max-w-none">
                    {template.subject}
                  </p>
                </div>
              </div>
              <button
                onClick={() => void deleteTemplate(template.id)}
                className="p-2 text-slate-400 transition-colors hover:text-rose-500 dark:hover:text-rose-400"
                aria-label={`Eliminar plantilla ${template.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {templates.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 py-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              No hay plantillas.
            </p>
          )}
        </div>
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-4 font-bold text-rose-500 transition-colors hover:bg-rose-100 active:scale-[0.98] dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20">
        <LogOut size={20} strokeWidth={2.5} />
        Cerrar sesion
      </button>

      {isAddingTemplate && (
        <OverlayModal>
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 sm:w-[90%] sm:rounded-3xl dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Nueva plantilla
              </h2>
              <button
                onClick={() => setIsAddingTemplate(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 transition-transform active:scale-90 dark:bg-slate-700 dark:text-slate-500"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nombre de la plantilla
                </label>
                <input
                  required
                  value={newTemplate.name}
                  onChange={(event) => setNewTemplate({ ...newTemplate, name: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
                  style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  placeholder="Ej. Primer contacto"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Asunto
                </label>
                <input
                  required
                  value={newTemplate.subject}
                  onChange={(event) =>
                    setNewTemplate({ ...newTemplate, subject: event.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
                  style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  placeholder="Usa {{brandName}}, {{creatorName}}"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cuerpo del mensaje
                </label>
                <textarea
                  required
                  value={newTemplate.body}
                  onChange={(event) => setNewTemplate({ ...newTemplate, body: event.target.value })}
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
                  style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  placeholder="Hola {{contactName}}..."
                />
                <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Variables: {'{{brandName}}, {{contactName}}, {{creatorName}}, {{deliverable}}'}
                </p>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-2xl py-4 font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                Guardar plantilla
              </button>
            </form>
          </div>
        </OverlayModal>
      )}
    </div>
  );
}
