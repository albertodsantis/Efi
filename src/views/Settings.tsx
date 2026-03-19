import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Bell, Calendar as CalendarIcon, Shield, LogOut, Check } from 'lucide-react';

const THEMES = [
  { id: 'purple', color: '#8b5cf6', name: 'Morado Eléctrico' },
  { id: 'green', color: '#10b981', name: 'Verde Neón' },
  { id: 'orange', color: '#f97316', name: 'Naranja Sunset' },
  { id: 'blue', color: '#3b82f6', name: 'Azul Océano' },
  { id: 'pink', color: '#f43f5e', name: 'Rosa Coral' },
  { id: 'black', color: '#171717', name: 'Carbón' },
];

export default function Settings() {
  const { accentColor, setAccentColor } = useAppContext();

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-2 tracking-tight">Configuración</h1>

      <div className="mb-10">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">Tema de la App</h2>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-5 justify-between">
            {THEMES.map(theme => {
              const isActive = accentColor === theme.color;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAccentColor(theme.color)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative shadow-sm"
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  {isActive && <Check size={20} className="text-white absolute z-10" strokeWidth={3} />}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-[3px] border-white scale-110 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">Ajustes Generales</h2>
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                <Bell size={20} />
              </div>
              <span className="font-bold text-gray-900 text-sm">Notificaciones Push</span>
            </div>
            <div className="w-14 h-7 bg-gray-200 rounded-full relative transition-colors">
              <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 left-0.5 shadow-md" />
            </div>
          </div>

          <div className="flex items-center justify-between p-5 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                <CalendarIcon size={20} />
              </div>
              <span className="font-bold text-gray-900 text-sm">Sincronizar Calendar</span>
            </div>
            <div className="w-14 h-7 rounded-full relative transition-colors shadow-inner" style={{ backgroundColor: accentColor }}>
              <div className="w-6 h-6 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md" />
            </div>
          </div>

          <div className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
                <Shield size={20} />
              </div>
              <span className="font-bold text-gray-900 text-sm">Privacidad y Seguridad</span>
            </div>
            <span className="text-gray-300 font-bold text-xl">›</span>
          </div>
        </div>
      </div>

      <button className="w-full py-4 rounded-2xl font-bold text-rose-500 bg-rose-50 flex items-center justify-center gap-2 transition-colors hover:bg-rose-100 active:scale-[0.98]">
        <LogOut size={20} strokeWidth={2.5} />
        Cerrar Sesión
      </button>
    </div>
  );
}
