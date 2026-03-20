import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
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
} from 'lucide-react';
import type { Task, TaskStatus } from '@shared/domain';
import { useAppContext } from '../context/AppContext';
import OverlayModal from '../components/OverlayModal';
import {
  Button,
  EmptyState,
  IconButton,
  MetricCard,
  ModalPanel,
  ScreenHeader,
  StatusBadge,
  SurfaceCard,
  cx,
} from '../components/ui';

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

const fieldClass =
  'w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-800';

const getStatusTone = (status: TaskStatus): 'warning' | 'info' | 'accent' | 'success' | 'neutral' => {
  if (status === 'Pendiente') return 'warning';
  if (status === 'En Progreso') return 'info';
  if (status === REVIEW_STATUS) return 'accent';
  if (status === 'Completada') return 'success';
  return 'neutral';
};

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
  const tasksByStatus = useMemo(
    () =>
      STATUSES.reduce(
        (accumulator, status) => {
          accumulator[status] = sortedTasks.filter((task) => task.status === status);
          return accumulator;
        },
        {} as Record<TaskStatus, Task[]>,
      ),
    [sortedTasks],
  );

  const currentStatus = STATUSES[currentStatusIdx];
  const visibleTasks = view === 'kanban' ? tasksByStatus[currentStatus] : sortedTasks;
  const todayIso = new Date().toISOString().split('T')[0];
  const selectedDateTasks = selectedDate
    ? sortedTasks.filter((task) => task.dueDate === selectedDate)
    : [];
  const editingTask = editingTaskId ? sortedTasks.find((task) => task.id === editingTaskId) ?? null : null;
  const syncedTasks = sortedTasks.filter((task) => Boolean(task.gcalEventId)).length;
  const weeklyTasks = sortedTasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return dueDate >= start && dueDate <= end;
  }).length;
  const openValue = sortedTasks
    .filter((task) => task.status !== 'Cobro')
    .reduce((sum, task) => sum + task.value, 0);

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
      alert('Error de conexión al sincronizar.');
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
      alert('Error de conexión al sincronizar.');
    } finally {
      setIsSyncingDown(false);
    }
  };

  const renderTask = (task: Task) => {
    const partner = partners.find((item) => item.id === task.partnerId);

    return (
      <div key={task.id}>
        <SurfaceCard tone="inset" className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
              {partner?.name || 'Sin marca'}
            </p>
            <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {task.title}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              ${task.value.toLocaleString()}
            </p>
            <div className="mt-2">
              <StatusBadge tone={getStatusTone(task.status)}>{task.status}</StatusBadge>
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {task.description || 'Sin descripción todavía.'}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <select
            value={task.status}
            disabled={updatingTaskId === task.id}
            onChange={(event) => void changeStatus(task.id, event.target.value as TaskStatus)}
            className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
            style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <IconButton
              icon={PencilLine}
              label={`Editar ${task.title}`}
              onClick={() => openEdit(task)}
            />
            <IconButton
              icon={Trash2}
              label={`Eliminar ${task.title}`}
              onClick={() => void removeTask(task)}
              disabled={deletingTaskId === task.id}
              tone="danger"
            />
            <button
              type="button"
              onClick={() => void syncTask(task)}
              disabled={syncingTaskId === task.id}
              className={cx(
                'inline-flex h-11 items-center gap-2 rounded-[1.2rem] px-3 text-xs font-bold transition-all disabled:opacity-50',
                task.gcalEventId
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              {syncingTaskId === task.id ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : task.gcalEventId ? (
                <CheckCircle2 size={14} />
              ) : (
                <CalendarIcon size={14} />
              )}
              <span className="hidden sm:inline">{task.gcalEventId ? 'Sincronizada' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} />
            {new Date(task.dueDate).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          {task.gcalEventId ? <span>Calendar activo</span> : <span>Sin enlace externo</span>}
        </div>
        </SurfaceCard>
      </div>
    );
  };

  const monthLabel = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDay }, (_, index) => (
    <div key={`empty-${index}`} className="aspect-square" />
  ));
  const days = Array.from({ length: daysInMonth }, (_, offset) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), offset + 1);
    const iso = date.toISOString().split('T')[0];
    const dayTasks = sortedTasks.filter((task) => task.dueDate === iso);
    const isToday = iso === todayIso;

    return (
      <button
        key={iso}
        type="button"
        onClick={() => dayTasks.length > 0 && setSelectedDate(iso)}
        className={cx(
          'aspect-square rounded-[1.4rem] border p-2 text-left transition-colors',
          isToday
            ? 'border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50'
            : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700',
          dayTasks.length > 0 ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <span
          className={cx(
            'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
            dayTasks.length > 0
              ? 'text-white'
              : 'text-slate-400 dark:text-slate-500',
          )}
          style={dayTasks.length > 0 ? { backgroundColor: accentColor } : undefined}
        >
          {date.getDate()}
        </span>
        <div className="mt-2 space-y-1">
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
    <div className="space-y-5 p-4 pb-6 lg:space-y-6 lg:px-8 lg:py-8">
      <ScreenHeader
        mobileOnly
        eyebrow="Pipeline"
        title="Pipeline"
        description="Sigue entregables, mueve fases y revisa sincronizaciones sin perder el control de la semana."
        actions={
          <div className="flex gap-2">
            <IconButton
              icon={DownloadCloud}
              label="Traer cambios desde Google Calendar"
              onClick={() => void syncDown()}
              disabled={isSyncingDown}
            />
            <IconButton
              icon={Plus}
              label="Crear nueva tarea"
              onClick={openCreate}
              tone="primary"
              accentColor={accentColor}
            />
          </div>
        }
        className="px-2"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={ListIcon}
          label="Tareas activas"
          value={`${sortedTasks.length}`}
          helper="Volumen total visible en este pipeline."
          accentColor={accentColor}
        />
        <MetricCard
          icon={CalendarDays}
          label="Esta semana"
          value={`${weeklyTasks}`}
          helper="Entregas previstas para los próximos 7 días."
          accentColor={accentColor}
        />
        <MetricCard
          icon={CalendarIcon}
          label="Sincronizadas"
          value={`${syncedTasks}`}
          helper="Tareas vinculadas con Google Calendar."
          accentColor={accentColor}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Valor abierto"
          value={`$${openValue.toLocaleString()}`}
          helper="Importe pendiente de cierre o cobro."
          accentColor={accentColor}
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SurfaceCard tone="muted" className="p-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'kanban', icon: Trello, label: 'Kanban' },
              { id: 'list', icon: ListIcon, label: 'Lista' },
              { id: 'calendar', icon: CalendarIcon, label: 'Mes' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id as typeof view)}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-[1.2rem] px-3 py-3 text-sm font-bold transition-all',
                  view === tab.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <div className="hidden items-center gap-2 lg:flex">
          <Button tone="secondary" onClick={() => void syncDown()}>
            <DownloadCloud size={16} />
            Actualizar Calendar
          </Button>
          <Button accentColor={accentColor} onClick={openCreate}>
            <Plus size={16} />
            Nueva tarea
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="space-y-4">
          <div className="lg:hidden">
            <SurfaceCard tone="muted" className="p-3">
              <div className="flex items-center justify-between gap-3">
                <IconButton
                  icon={ChevronLeft}
                  label="Ver fase anterior"
                  onClick={() => setCurrentStatusIdx(Math.max(0, currentStatusIdx - 1))}
                  disabled={currentStatusIdx === 0}
                  tone="ghost"
                />
                <div className="text-center">
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
                    Fase {currentStatusIdx + 1} de {STATUSES.length}
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold" style={{ color: accentColor }}>
                    {currentStatus}
                  </h2>
                </div>
                <IconButton
                  icon={ChevronRight}
                  label="Ver siguiente fase"
                  onClick={() => setCurrentStatusIdx(Math.min(STATUSES.length - 1, currentStatusIdx + 1))}
                  disabled={currentStatusIdx === STATUSES.length - 1}
                  tone="ghost"
                />
              </div>
            </SurfaceCard>

            <div className="mt-3 space-y-3">
              {visibleTasks.length > 0 ? (
                visibleTasks.map(renderTask)
              ) : (
                <EmptyState
                  icon={Trello}
                  title="No hay tareas en esta fase"
                  description="Cuando muevas tareas o crees una nueva, aparecerá aquí."
                />
              )}
            </div>
          </div>

          <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {STATUSES.map((status) => {
              const columnTasks = tasksByStatus[status];

              return (
                <div key={status}>
                  <SurfaceCard tone="muted" className="p-4 lg:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400 dark:text-slate-500 uppercase">
                        Fase
                      </p>
                      <h2 className="mt-1 text-base font-extrabold" style={{ color: accentColor }}>
                        {status}
                      </h2>
                    </div>
                    <div className="rounded-[1.1rem] bg-white px-3 py-2 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {columnTasks.length}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 hide-scrollbar">
                    {columnTasks.length > 0 ? (
                      columnTasks.map(renderTask)
                    ) : (
                      <EmptyState
                        title="Sin tareas en esta fase"
                        description="Usa la vista completa para arrastrar flujo y mantener el pipeline equilibrado."
                        className="px-4 py-6"
                      />
                    )}
                  </div>
                  </SurfaceCard>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'list' ? (
        sortedTasks.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">{sortedTasks.map(renderTask)}</div>
        ) : (
          <EmptyState
            icon={ListIcon}
            title="Todavía no hay tareas"
            description="Añade tu primera entrega para empezar a construir el pipeline."
            action={
              <Button accentColor={accentColor} onClick={openCreate}>
                <Plus size={16} />
                Crear tarea
              </Button>
            }
          />
        )
      ) : null}

      {view === 'calendar' ? (
        <SurfaceCard className="p-5 lg:p-6">
          <div className="mb-5 flex items-center justify-between">
            <IconButton
              icon={ChevronLeft}
              label="Mes anterior"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              tone="ghost"
            />
            <h2 className="text-lg font-extrabold capitalize text-slate-900 dark:text-slate-100">
              {monthLabel}
            </h2>
            <IconButton
              icon={ChevronRight}
              label="Mes siguiente"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              tone="ghost"
            />
          </div>

          <div className="mb-3 grid grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] font-bold tracking-[0.14em] text-slate-400 dark:text-slate-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {blanks}
            {days}
          </div>
        </SurfaceCard>
      ) : null}

      {selectedDate ? (
        <OverlayModal onClose={() => setSelectedDate(null)}>
          <ModalPanel
            title={new Date(selectedDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            description="Estas son las tareas programadas para esta fecha."
            onClose={() => setSelectedDate(null)}
            size="lg"
          >
            <div className="space-y-3">
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map(renderTask)
              ) : (
                <EmptyState title="No hay tareas para este día" />
              )}
            </div>
          </ModalPanel>
        </OverlayModal>
      ) : null}

      {modalMode ? (
        <OverlayModal onClose={resetModal}>
          <ModalPanel
            title={modalMode === 'edit' ? 'Editar tarea' : 'Nueva tarea'}
            description="Completa la información principal para que el pipeline se mantenga claro y accionable."
            onClose={resetModal}
            footer={
              <div className="flex gap-3">
                {modalMode === 'edit' && editingTask ? (
                  <Button
                    tone="danger"
                    className="flex-1"
                    onClick={() => void removeTask(editingTask)}
                    disabled={deletingTaskId === editingTask.id}
                  >
                    {deletingTaskId === editingTask.id ? 'Eliminando…' : 'Eliminar'}
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  form="pipeline-task-form"
                  accentColor={accentColor}
                  className="flex-1"
                  disabled={isSubmittingTask}
                >
                  {isSubmittingTask
                    ? 'Guardando…'
                    : modalMode === 'edit'
                      ? 'Guardar cambios'
                      : 'Crear tarea'}
                </Button>
              </div>
            }
          >
            <form id="pipeline-task-form" onSubmit={saveTask} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Título
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="Ej. Reel de lanzamiento"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Descripción
                  </label>
                  <textarea
                    required
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className={cx(fieldClass, 'min-h-[130px]')}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="Define el entregable, formato y cualquier detalle operativo."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Partner o marca
                  </label>
                  <input
                    required
                    value={form.partnerName}
                    onChange={(event) => setForm({ ...form, partnerName: event.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="Ej. TechBrand"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Valor
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.value}
                    onChange={(event) => setForm({ ...form, value: event.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="1500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400 uppercase">
                    Estado inicial
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
                    className={fieldClass}
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </ModalPanel>
        </OverlayModal>
      ) : null}
    </div>
  );
}
