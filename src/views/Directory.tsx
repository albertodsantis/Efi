import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Plus, Building2, Mail, Instagram, ChevronDown, ChevronUp } from 'lucide-react';

export default function Directory() {
  const { partners, accentColor } = useAppContext();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredPartners = partners.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Activo': return 'bg-emerald-100 text-emerald-700';
      case 'En Negociación': return 'bg-amber-100 text-amber-700';
      case 'On Hold': return 'bg-gray-100 text-gray-700';
      case 'Relación Culminada': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 mt-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Directorio</h1>
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar marcas o contactos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-shadow"
          style={{ '--tw-ring-color': accentColor } as any}
        />
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pb-4 hide-scrollbar">
        {filteredPartners.map(partner => {
          const isExpanded = expandedId === partner.id;
          return (
            <div key={partner.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <div
                className="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50"
                onClick={() => setExpandedId(isExpanded ? null : partner.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{partner.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mt-1.5 inline-block ${getStatusColor(partner.status)}`}>
                      {partner.status}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400 shrink-0 ml-2">
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-50 bg-gray-50/30">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 mt-2">Contactos</h4>
                  {partner.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {partner.contacts.map(contact => (
                        <div key={contact.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="font-bold text-sm text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500 font-medium mb-3">{contact.role}</p>
                          <div className="flex gap-4">
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                              <Mail size={14} /> Email
                            </a>
                            <a href={`https://instagram.com/${contact.ig.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                              <Instagram size={14} /> {contact.ig}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium italic py-2">No hay contactos registrados.</p>
                  )}
                  <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors active:scale-[0.98]">
                    + Añadir Contacto
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filteredPartners.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No se encontraron resultados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
