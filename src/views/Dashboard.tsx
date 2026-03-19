import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const { profile, tasks, partners, accentColor } = useAppContext();

  const activePipelineValue = tasks
    .filter(t => t.status !== 'Cobro')
    .reduce((sum, t) => sum + t.value, 0);

  const tasksToday = tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length;

  const upcomingTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 4);

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mt-2">
        <div>
          <p className="text-gray-500 text-sm font-medium">Hola,</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{profile.name.split(' ')[0]}</h1>
        </div>
        <img src={profile.avatar} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="p-2.5 rounded-2xl w-fit" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            <DollarSign size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Pipeline Activo</p>
            <p className="text-2xl font-bold text-gray-900">${activePipelineValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="p-2.5 rounded-2xl w-fit" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Tareas Hoy</p>
            <p className="text-2xl font-bold text-gray-900">{tasksToday}</p>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex justify-between items-end mb-5">
          <h2 className="text-lg font-bold text-gray-900">Próximos Entregables</h2>
        </div>
        <div className="space-y-3">
          {upcomingTasks.map(task => {
            const partner = partners.find(p => p.id === task.partnerId);
            return (
              <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform active:scale-95">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                  {partner?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{task.title}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">{partner?.name} • {task.status}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-700">
                    {new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            );
          })}
          {upcomingTasks.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6 bg-white rounded-2xl border border-gray-100 border-dashed">No hay entregables próximos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
