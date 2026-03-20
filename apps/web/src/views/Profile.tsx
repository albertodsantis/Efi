import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Edit2, Target, Download, X } from 'lucide-react';

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
            .container { max-w-3xl; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
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

            <h2>Objetivos del Año</h2>
            <ul class="goals">
              ${profile.goals.map(g => `<li>${g}</li>`).join('')}
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
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center mb-10 mt-6">
        <div className="relative mb-5">
          <img src={profile.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover" />
          <button
            onClick={openProfileEditor}
            className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
          >
            <Edit2 size={18} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
        <p className="text-gray-500 font-semibold mt-1">{profile.handle}</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            <Target size={22} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Objetivos del Año</h2>
        </div>
        <div className="space-y-4">
          {profile.goals.map((goal, index) => (
            <div key={index} className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">
                {index + 1}
              </div>
              <input
                type="text"
                value={goal}
                onChange={(e) => handleGoalChange(index, e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-4 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': accentColor } as any}
                placeholder="Escribe un objetivo..."
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerateMediaKit}
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
        style={{ backgroundColor: accentColor }}
      >
        <Download size={20} />
        Generar Media Kit
      </button>

      {isEditingProfile && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-800 w-full sm:w-[90%] sm:rounded-3xl rounded-t-[2rem] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar perfil</h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input
                required
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': accentColor } as any}
                placeholder="Nombre"
              />
              <input
                required
                value={profileForm.handle}
                onChange={(event) => setProfileForm({ ...profileForm, handle: event.target.value })}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': accentColor } as any}
                placeholder="@tuusuario"
              />
              <input
                required
                value={profileForm.avatar}
                onChange={(event) => setProfileForm({ ...profileForm, avatar: event.target.value })}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': accentColor } as any}
                placeholder="URL del avatar"
              />
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
