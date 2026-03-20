import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  List as ListIcon,
  PencilLine,
  Plus,
  RefreshCw,
  Trello,
  Trash2,
  X,
} from 'lucide-react';
import type { Task, TaskStatus } from '@shared/domain';

const REVIEW_STATUS = `En Revisi${'\u00f3'}n` as TaskStatus;
const STATUSES: TaskStatus[] = ['Pendiente', 'En Progreso', REVIEW_STATUS, 'Completada', 'Cobro'];
const EMPTY_FORM = {
  title: '',
  description: '',
  partnerName: '',
  value: '',
  dueDate: '',
  status: 'Pendiente' as TaskStatus,
};
const cardClass =
  'bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)]';
const fieldClass =
  'w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2';

const badgeClass = (status: TaskStatus) =>
  status === 'Completada' || status === 'Cobro'
    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
    : status === 'En Progreso'
      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      : status === REVIEW_STATUS
        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';

export default function Pipeline() {
  const {
    tasks,
    partners,
    accentColor,
    addTask,
    addPartner,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useAppContext();
  const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSyncingDown, setIsSyncingDown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks],
  );
  const currentStatus = STATUSES[currentStatusIdx];
  const visibleTasks = view === 'kanban' ? sortedTasks.filter((task) => task.status === currentStatus) : sortedTasks;
  const todayIso = new Date().toISOString().split('T')[0];
  const selectedDateTasks = selectedDate
    ? sortedTasks.filter((task) => task.dueDate === selectedDate)
    : [];
  const editingTask = editingTaskId ? sortedTasks.find((task) => task.id === editingTaskId) ?? null : null;

  const resetModal = () => {
    setModalMode(null);
    setEditingTaskId(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditingTaskId(null);
    setForm({ ...EMPTY_FORM, dueDate: todayIso, status: currentStatus });
    setModalMode('create');
  };

  const openEdit = (task: Task) => {
    const partnerName = partners.find((partner) => partner.id === task.partnerId)?.name || '';
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      partnerName,
      value: String(task.value),
      dueDate: task.dueDate,
      status: task.status,
    });
    setModalMode('edit');
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingTask(true);
    try {
      const normalizedPartner = form.partnerName.trim();
      let partnerId = partners.find(
        (partner) => partner.name.trim().toLowerCase() === normalizedPartner.toLowerCase(),
      )?.id;
      if (!partnerId) {
        partnerId = await addPartner({ name: normalizedPartner, status: 'Prospecto', contacts: [] });
      }
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        partnerId,
        status: form.status,
        dueDate: form.dueDate,
        value: Number(form.value) || 0,
      };
      if (modalMode === 'edit' && editingTaskId) {
        await updateTask(editingTaskId, payload);
      } else {
        await addTask(payload);
      }
      resetModal();
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const changeStatus = async (taskId: string, status: TaskStatus) => {
    setUpdatingTaskId(taskId);
    try {
      await updateTaskStatus(taskId, status);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Eliminar "${task.title}" del pipeline?`)) return;
    setDeletingTaskId(task.id);
    try {
      await deleteTask(task.id);
      if (editingTaskId === task.id) resetModal();
      if (selectedDate && selectedDateTasks.filter((item) => item.id !== task.id).length === 0) {
        setSelectedDate(null);
      }
    } finally {
      setDeletingTaskId(null);
    }
  };

  const syncTask = async (task: Task) => {
    setSyncingTaskId(task.id);
    try {
      const partner = partners.find((item) => item.id === task.partnerId);
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { ...task, partnerName: partner?.name } }),
      });
      if (!response.ok) {
        alert('Error al sincronizar. Conecta Google Calendar desde Ajustes.');
        return;
      }
      const data = await response.json();
      await updateTask(task.id, { gcalEventId: data.eventId });
    } catch (error) {
      console.error(error);
      alert('Error de conexion al sincronizar.');
    } finally {
      setSyncingTaskId(null);
    }
  };

  const syncDown = async () => {
    setIsSyncingDown(true);
    try {
      const eventIds = tasks.map((task) => task.gcalEventId).filter((id): id is string => Boolean(id));
      if (eventIds.length === 0) return;
      const response = await fetch('/api/calendar/sync-down', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });
      if (!response.ok) {
        alert('Error al sincronizar desde Google Calendar.');
        return;
      }
      const data = await response.json();
      await Promise.all(
        (data.updatedEvents || []).map(async (updated: { eventId: string; dueDate: string }) => {
          const task = tasks.find((item) => item.gcalEventId === updated.eventId);
          if (task && task.dueDate !== updated.dueDate) {
            await updateTask(task.id, { dueDate: updated.dueDate });
          }
        }),
      );
    } catch (error) {
      console.error(error);
      alert('Error de conexion al sincronizar.');
    } finally {
      setIsSyncingDown(false);
    }
  };

  const renderTask = (task: Task) => {
    const partner = partners.find((item) => item.id === task.partnerId);
    return (
      <div key={task.id} className={`${cardClass} p-5 space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {partner?.name || 'Sin marca'}
            </p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mt-1">{task.title}</h3>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">
              ${task.value.toLocaleString()}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mt-1.5 inline-block ${badgeClass(task.status)}`}>
              {task.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {task.description || 'Sin descripcion'}
        </p>
        <select
          value={task.status}
          disabled={updatingTaskId === task.id}
          onChange={(event) => void changeStatus(task.id, event.target.value as TaskStatus)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            <CalendarIcon size={14} />
            {new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(task)}
              className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300"
            >
              <PencilLine size={15} />
            </button>
            <button
              onClick={() => void removeTask(task)}
              disabled={deletingTaskId === task.id}
              className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-400/10 flex items-center justify-center text-rose-500 disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={() => void syncTask(task)}
              disabled={syncingTaskId === task.id}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl ${
                task.gcalEventId
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
              }`}
            >
              {syncingTaskId === task.id ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : task.gcalEventId ? (
                <CheckCircle2 size={14} />
              ) : (
                <CalendarIcon size={14} />
              )}
              {task.gcalEventId ? 'Sincronizada' : 'Sincronizar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const monthLabel = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDay }, (_, index) => <div key={`empty-${index}`} className="aspect-square" />);
  const days = Array.from({ length: daysInMonth }, (_, offset) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), offset + 1);
    const iso = date.toISOString().split('T')[0];
    const dayTasks = sortedTasks.filter((task) => task.dueDate === iso);
    const isToday = iso === todayIso;
    return (
      <button
        key={iso}
        onClick={() => dayTasks.length > 0 && setSelectedDate(iso)}
        className={`aspect-square rounded-2xl border p-2 text-left ${
          isToday ? 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
        } ${dayTasks.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span
          className={`text-xs font-bold ${
            dayTasks.length > 0 ? 'inline-flex w-6 h-6 items-center justify-center rounded-full text-white' : 'text-slate-400 dark:text-slate-500'
          }`}
          style={dayTasks.length > 0 ? { backgroundColor: accentColor } : {}}
        >
          {date.getDate()}
        </span>
        <div className="mt-1 space-y-1">
          {dayTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="h-1.5 rounded-full"
              style={{ backgroundColor: task.gcalEventId ? '#10b981' : accentColor, opacity: 0.8 }}
            />
          ))}
        </div>
      </button>
    );
  });

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 pb-2 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pipeline</h1>
          <div className="flex gap-3">
            <button onClick={syncDown} disabled={isSyncingDown} className="w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 flex items-center justify-center disabled:opacity-50">
              <DownloadCloud size={20} className={isSyncingDown ? 'animate-bounce' : ''} />
            </button>
            <button onClick={openCreate} className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)]" style={{ backgroundColor: accentColor }}>
              <Plus size={28} />
            </button>
          </div>
        </div>
        <div className="flex bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60 rounded-[1.5rem] p-1.5">
          {[{ id: 'kanban', icon: Trello, label: 'Kanban' }, { id: 'list', icon: ListIcon, label: 'Lista' }, { id: 'calendar', icon: CalendarIcon, label: 'Mes' }].map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id as typeof view)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold ${view === tab.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto hide-scrollbar space-y-4">
        {view === 'kanban' && (
          <div className="space-y-4">
            <div className={`${cardClass} p-3 flex items-center justify-between`}>
              <button onClick={() => setCurrentStatusIdx(Math.max(0, currentStatusIdx - 1))} disabled={currentStatusIdx === 0} className="p-3 text-slate-400 dark:text-slate-500 disabled:opacity-30"><ChevronLeft size={24} /></button>
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Fase {currentStatusIdx + 1} de {STATUSES.length}</p>
                <h2 className="text-lg font-extrabold" style={{ color: accentColor }}>{currentStatus}</h2>
              </div>
              <button onClick={() => setCurrentStatusIdx(Math.min(STATUSES.length - 1, currentStatusIdx + 1))} disabled={currentStatusIdx === STATUSES.length - 1} className="p-3 text-slate-400 dark:text-slate-500 disabled:opacity-30"><ChevronRight size={24} /></button>
            </div>
            {visibleTasks.length > 0 ? visibleTasks.map(renderTask) : <div className={`${cardClass} p-12 text-center text-slate-400 dark:text-slate-500 border-dashed border-2`}><p className="font-medium">No hay tareas en esta fase.</p></div>}
          </div>
        )}
        {view === 'list' && (visibleTasks.length > 0 ? visibleTasks.map(renderTask) : <div className={`${cardClass} p-12 text-center text-slate-400 dark:text-slate-500 border-dashed border-2`}><p className="font-medium">Todavia no hay tareas.</p></div>)}
        {view === 'calendar' && (
          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 text-slate-400 dark:text-slate-500"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{monthLabel}</h2>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 text-slate-400 dark:text-slate-500"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">{['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2">{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1.5">{blanks}{days}</div>
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-800 w-full sm:w-[90%] sm:rounded-3xl rounded-t-[2rem] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setSelectedDate(null)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400"><X size={18} /></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">{selectedDateTasks.map(renderTask)}</div>
          </div>
        </div>
      )}

      {modalMode && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-800 w-full sm:w-[90%] sm:rounded-3xl rounded-t-[2rem] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{modalMode === 'edit' ? 'Editar tarea' : 'Nueva tarea'}</h2>
              <button onClick={resetModal} className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400"><X size={18} /></button>
            </div>
            <form onSubmit={saveTask} className="space-y-4">
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} style={{ '--tw-ring-color': accentColor } as React.CSSProperties} placeholder="Titulo" />
              <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${fieldClass} min-h-[110px]`} style={{ '--tw-ring-color': accentColor } as React.CSSProperties} placeholder="Descripcion" />
              <input required value={form.partnerName} onChange={(event) => setForm({ ...form, partnerName: event.target.value })} className={fieldClass} style={{ '--tw-ring-color': accentColor } as React.CSSProperties} placeholder="Partner o marca" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" min="0" required value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className={fieldClass} style={{ '--tw-ring-color': accentColor } as React.CSSProperties} placeholder="Valor" />
                <input type="date" required value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className={fieldClass} style={{ '--tw-ring-color': accentColor } as React.CSSProperties} />
              </div>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })} className={fieldClass} style={{ '--tw-ring-color': accentColor } as React.CSSProperties}>
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <div className="flex gap-3">
                {modalMode === 'edit' && editingTask && (
                  <button type="button" onClick={() => void removeTask(editingTask)} disabled={deletingTaskId === editingTask.id} className="flex-1 rounded-2xl py-4 font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 disabled:opacity-50">
                    {deletingTaskId === editingTaskId ? 'Eliminando...' : 'Eliminar'}
                  </button>
                )}
                <button type="submit" disabled={isSubmittingTask} className="flex-1 rounded-2xl py-4 font-bold text-white disabled:opacity-60" style={{ backgroundColor: accentColor }}>
                  {isSubmittingTask ? 'Guardando...' : modalMode === 'edit' ? 'Guardar cambios' : 'Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
