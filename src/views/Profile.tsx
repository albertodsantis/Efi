import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Edit2, Target, Download } from 'lucide-react';

export default function Profile() {
  const { profile, accentColor, updateProfile } = useAppContext();

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...profile.goals] as [string, string, string];
    newGoals[index] = value;
    updateProfile({ goals: newGoals });
  };

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center text-center mb-10 mt-6">
        <div className="relative mb-5">
          <img src={profile.avatar} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover" />
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 active:scale-95 transition-transform">
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
        disabled
        className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 opacity-50 cursor-not-allowed shadow-md"
        style={{ backgroundColor: accentColor }}
      >
        <Download size={20} />
        Generar Media Kit (Próximamente)
      </button>
    </div>
  );
}
