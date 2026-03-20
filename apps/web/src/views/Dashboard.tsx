import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, DollarSign, CheckCircle2, Users } from 'lucide-react';

export default function Dashboard() {
  const { profile, tasks, partners, accentColor } = useAppContext();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const activePipelineValue = tasks
    .filter((task) => task.status !== 'Cobro')
    .reduce((sum, task) => sum + task.value, 0);
  const tasksToday = tasks.filter(
    (task) => new Date(task.dueDate).toDateString() === new Date().toDateString(),
  ).length;
  const weeklyWindowEnd = new Date(startOfToday);
  weeklyWindowEnd.setDate(weeklyWindowEnd.getDate() + 6);
  const tasksThisWeek = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= startOfToday && dueDate <= weeklyWindowEnd;
  }).length;
  const activePartners = partners.filter((partner) => partner.status === 'Activo').length;
  const upcomingTasks = [...tasks]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos dias' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const statCards = [
    {
      label: 'Pipeline activo',
      value: `$${activePipelineValue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: 'Tareas de hoy',
      value: `${tasksToday}`,
      icon: CheckCircle2,
    },
    {
      label: 'Partners activos',
      value: `${activePartners}`,
      icon: Users,
    },
    {
      label: 'Esta semana',
      value: `${tasksThisWeek}`,
      icon: Calendar,
    },
  ];

  return (
    <div className="p-6 lg:px-8 lg:py-8 space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-800/70 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22)] p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{greeting},</p>
              <h1 className="mt-2 text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {profile.name.split(' ')[0]}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Aqui tienes una vista rapida del negocio: entregables cercanos, valor abierto y el ritmo del pipeline.
              </p>
            </div>
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1.4rem] border-4 border-white dark:border-slate-800 shadow-sm object-cover"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-[1.7rem] border border-white/70 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/40 p-4 sm:p-5"
                >
                  <div
                    className="mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    <Icon size={21} strokeWidth={2.4} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 dark:border-slate-700/60 bg-white/75 dark:bg-slate-800/70 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.22)] p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
            >
              <Calendar size={20} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Prioridad
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                Proximos entregables
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => {
                const partner = partners.find((item) => item.id === task.partnerId);
                return (
                  <div
                    key={task.id}
                    className="rounded-[1.5rem] border border-slate-100 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/40 px-4 py-4 flex items-center gap-4"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold"
                      style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
                    >
                      {partner?.name?.charAt(0) || 'T'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h3>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {partner?.name || 'Sin marca'} · {task.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {new Date(task.dueDate).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        ${task.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium text-center py-8 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                No hay entregables proximos.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
