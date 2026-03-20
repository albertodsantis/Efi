import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Edit2, Target, UserCircle2, X } from 'lucide-react';
import OverlayModal from '../components/OverlayModal';

export default function Profile() {
  const { profile, accentColor, updateProfile } = useAppContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar,
  });

  const openProfileEditor = () => {
    setProfileForm({
      name: profile.name,
      handle: profile.handle,
      avatar: profile.avatar,
    });
    setIsEditingProfile(true);
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...profile.goals] as [string, string, string];
    newGoals[index] = value;
    void updateProfile({ goals: newGoals });
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleGenerateMediaKit = () => {
    const mediaKitHtml = `
      <html>
        <head>
          <title>Media Kit - ${profile.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1f2937; margin: 0; padding: 40px; background: #f9fafb; }
            .container { max-width: 48rem; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
            .header { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; }
            .avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }
            h1 { margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px; }
            .handle { color: ${accentColor}; font-size: 20px; font-weight: 600; margin-top: 4px; }
            h2 { font-size: 24px; font-weight: 700; margin-top: 40px; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
            .goals { list-style: none; padding: 0; }
            .goals li { background: #f9fafb; padding: 16px 20px; border-radius: 12px; margin-bottom: 12px; font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 12px; }
            .goals li::before { content: '✓'; color: ${accentColor}; font-weight: bold; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
            .stat-card { background: #f9fafb; padding: 24px; border-radius: 16px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: 800; color: ${accentColor}; }
            .stat-label { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${profile.avatar}" alt="${profile.name}" class="avatar" />
              <div>
                <h1>${profile.name}</h1>
                <div class="handle">${profile.handle}</div>
              </div>
            </div>

            <div class="stats">
              <div class="stat-card">
                <div class="stat-value">1.2M</div>
                <div class="stat-label">Seguidores</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">8.5%</div>
                <div class="stat-label">Engagement</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">450K</div>
                <div class="stat-label">Alcance Promedio</div>
              </div>
            </div>

            <h2>Objetivos del Ano</h2>
            <ul class="goals">
              ${profile.goals.map((goal) => `<li>${goal}</li>`).join('')}
            </ul>
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([mediaKitHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 lg:px-8 lg:py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:hidden max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
          Perfil
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Identidad y media kit
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Ajusta tu presencia, tus objetivos y el material que compartes con marcas.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[2.25rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_60px_-26px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-800/74">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-32 w-32 rounded-[2rem] border-4 border-white object-cover shadow-[0_20px_50px_-26px_rgba(15,23,42,0.35)] dark:border-slate-800"
              />
              <button
                onClick={openProfileEditor}
                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white text-slate-600 shadow-md transition-transform hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                aria-label="Editar perfil"
              >
                <Edit2 size={18} />
              </button>
            </div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Creator profile
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {profile.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {profile.handle}
            </p>

            <div className="mt-6 grid w-full grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Objetivos
                </p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">3</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Perfil
                </p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">Live</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Kit
                </p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">PDF</p>
              </div>
            </div>

            <button
              onClick={handleGenerateMediaKit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.5rem] py-4 font-bold text-white shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
            >
              <Download size={20} />
              Generar Media Kit
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2.25rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_60px_-26px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-800/74">
            <div className="mb-6 flex items-center gap-3">
              <div
                className="rounded-2xl p-2.5"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <Target size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Prioridades
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Objetivos del ano
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {profile.goals.map((goal, index) => (
                <div key={index} className="relative">
                  <div className="absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-400 dark:bg-slate-700 dark:text-slate-300">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={goal}
                    onChange={(event) => handleGoalChange(index, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-sm font-bold text-slate-700 transition-all focus:bg-white focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:bg-slate-800"
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="Escribe un objetivo..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-white/60 bg-white/78 p-6 shadow-[0_20px_60px_-26px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-800/74">
            <div className="flex items-center gap-3">
              <div
                className="rounded-2xl p-2.5"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <UserCircle2 size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  Perfil activo
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                  Vista rapida
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Nombre
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{profile.name}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  Handle
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{profile.handle}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isEditingProfile && (
        <OverlayModal>
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:w-[90%] sm:rounded-3xl dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Editar perfil
              </h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-400 dark:bg-slate-700 dark:text-slate-400"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input
                required
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:bg-slate-800"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                placeholder="Nombre"
              />
              <input
                required
                value={profileForm.handle}
                onChange={(event) => setProfileForm({ ...profileForm, handle: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:bg-slate-800"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                placeholder="@tuusuario"
              />
              <input
                required
                value={profileForm.avatar}
                onChange={(event) => setProfileForm({ ...profileForm, avatar: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:bg-slate-800"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                placeholder="URL del avatar"
              />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full rounded-2xl py-4 font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </form>
          </div>
        </OverlayModal>
      )}
    </div>
  );
}
