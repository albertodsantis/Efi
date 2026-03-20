import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Plus, Building2, Mail, Instagram, ChevronDown, ChevronUp, Send, Edit2, Trash2, X } from 'lucide-react';
import { Contact, Partner } from '@shared/domain';
import OverlayModal from '../components/OverlayModal';

const PARTNER_STATUSES = [
  'Prospecto',
  'En Negociación',
  'Activo',
  'Inactivo',
  'On Hold',
  'Relación Culminada',
] as const;

const PARTNER_STATUS_LABELS: Record<string, string> = {
  Prospecto: 'Prospecto',
  'En NegociaciÃ³n': 'En negociacion',
  Activo: 'Activo',
  Inactivo: 'Inactivo',
  'On Hold': 'En pausa',
  'RelaciÃ³n Culminada': 'Relacion cerrada',
};

const modalPanelClass =
  'bg-white dark:bg-slate-800 w-full sm:w-[90%] sm:rounded-[2.5rem] rounded-t-[2.5rem] p-8 pt-10 shadow-2xl';
const fieldClass =
  'w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100';

export default function Directory() {
  const { partners, accentColor, templates, profile, addContact, updateContact, deleteContact, updatePartner, addPartner, tasks } = useAppContext();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composingTo, setComposingTo] = useState<{ contact: Contact, partner: Partner } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messagePreview, setMessagePreview] = useState({ subject: '', body: '' });
  
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [addingContactTo, setAddingContactTo] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<{ partnerId: string, contact: Contact } | null>(null);
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', ig: '' });
  const [newPartner, setNewPartner] = useState({ name: '', status: 'Prospecto' as Partner['status'] });

  const filteredPartners = partners.filter((partner) => {
    const query = search.toLowerCase().trim();
    if (!query) {
      return true;
    }

    const partnerMatch = partner.name.toLowerCase().includes(query);
    const contactMatch = partner.contacts.some((contact) =>
      [contact.name, contact.email, contact.ig, contact.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );

    return partnerMatch || contactMatch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Prospecto': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'Activo': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'En Negociación': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'Inactivo': return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300';
      case 'On Hold': return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300';
      case 'Relación Culminada': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300';
    }
  };

  const closeComposer = () => {
    setComposingTo(null);
    setSelectedTemplateId('');
    setMessagePreview({ subject: '', body: '' });
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && composingTo) {
      // Find the most relevant task for this partner (e.g., first one not completed)
      const partnerTasks = tasks.filter(t => t.partnerId === composingTo.partner.id && t.status !== 'Cobro');
      const relevantTask = partnerTasks.length > 0 ? partnerTasks[0] : null;
      const deliverableText = relevantTask ? `${relevantTask.title} (${relevantTask.description})` : '[Entregable no especificado]';

      const replaceVars = (text: string) => {
        return text
          .replace(/{{brandName}}/g, composingTo.partner.name)
          .replace(/{{contactName}}/g, composingTo.contact.name.split(' ')[0])
          .replace(/{{creatorName}}/g, profile.name)
          .replace(/{{deliverable}}/g, deliverableText);
      };
      setMessagePreview({
        subject: replaceVars(template.subject),
        body: replaceVars(template.body)
      });
    } else {
      setMessagePreview({ subject: '', body: '' });
    }
  };

  const handleSend = () => {
    if (!composingTo) return;
    const mailto = `mailto:${composingTo.contact.email}?subject=${encodeURIComponent(messagePreview.subject)}&body=${encodeURIComponent(messagePreview.body)}`;
    window.open(mailto, '_blank');
    closeComposer();
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const partnerId = await addPartner({ name: newPartner.name.trim(), status: newPartner.status, contacts: [] });
    setExpandedId(partnerId);
    setIsAddingPartner(false);
    setNewPartner({ name: '', status: 'Prospecto' });
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingContactTo) {
      await addContact(addingContactTo, newContact);
      setAddingContactTo(null);
      setNewContact({ name: '', role: '', email: '', ig: '' });
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      await updateContact(editingContact.partnerId, editingContact.contact.id, editingContact.contact);
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async (partnerId: string, contactId: string) => {
    await deleteContact(partnerId, contactId);
  };

  return (
    <div className="p-6 lg:px-8 lg:py-8 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 mt-2 flex items-start justify-between gap-4 lg:mb-8 lg:mt-0">
        <div className="lg:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Relaciones comerciales
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Directorio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Centraliza marcas, contactos y mensajes para mover conversaciones sin perder contexto.
          </p>
        </div>
        <button
          onClick={() => setIsAddingPartner(true)}
          aria-label="Anadir marca"
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-transform active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="relative mb-6 lg:max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Buscar marcas o contactos"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 rounded-[2rem] pl-14 pr-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
          style={{ '--tw-ring-color': accentColor } as any}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3 flex-1 overflow-y-auto pb-4 hide-scrollbar auto-rows-max">
        {filteredPartners.map(partner => {
          const isExpanded = expandedId === partner.id;
          return (
            <div key={partner.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white/60 dark:border-slate-700/60 overflow-hidden transition-all">
              <button
                type="button"
                aria-expanded={isExpanded}
                className="w-full p-5 flex items-center justify-between cursor-pointer text-left active:bg-slate-50/50 dark:active:bg-slate-700/50"
                onClick={() => setExpandedId(isExpanded ? null : partner.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{partner.name}</h3>
                    <select
                      value={partner.status}
                      onChange={(e) => void updatePartner(partner.id, { status: e.target.value as any })}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Cambiar estado de ${partner.name}`}
                      className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl mt-1.5 inline-block appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800 ${getStatusColor(partner.status)}`}
                      style={{ '--tw-ring-color': accentColor } as any}
                    >
                      {PARTNER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {PARTNER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100/50 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/30">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-2">Contactos</h4>
                  {partner.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {partner.contacts.map(contact => (
                        <div key={contact.id} className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-[15px] text-slate-800 dark:text-slate-100">{contact.name}</p>
                              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{contact.role}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => setEditingContact({ partnerId: partner.id, contact })}
                                aria-label={`Editar contacto ${contact.name}`}
                                className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(partner.id, contact.id)}
                                aria-label={`Eliminar contacto ${contact.name}`}
                                className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-900/30 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button 
                                onClick={() => setComposingTo({ contact, partner })}
                                aria-label={`Redactar mensaje para ${contact.name}`}
                                className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[13px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              <Mail size={16} /> Email
                            </a>
                            <a href={`https://instagram.com/${contact.ig.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                              <Instagram size={16} /> {contact.ig}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[15px] text-slate-400 dark:text-slate-500 font-medium italic py-3">Aun no hay contactos registrados.</p>
                  )}
                  <button 
                    onClick={() => setAddingContactTo(partner.id)}
                    className="w-full mt-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-[13px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors active:scale-[0.98]"
                  >
                    + Anadir contacto
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filteredPartners.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <p className="font-medium text-[15px]">No hay resultados.</p>
          </div>
        )}
      </div>

      {isAddingPartner && (
        <OverlayModal tone="slate" onClose={() => setIsAddingPartner(false)}>
          <div className={modalPanelClass}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Nueva marca</h2>
              <button onClick={() => setIsAddingPartner(false)} aria-label="Cerrar modal" className="text-slate-400 dark:text-slate-500 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90 transition-transform hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPartner} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Nombre</label>
                <input
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentColor } as any}
                  placeholder="Ej. Nike, Samsung, Zara"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Estado</label>
                <select
                  value={newPartner.status}
                  onChange={(e) => setNewPartner({ ...newPartner, status: e.target.value as Partner['status'] })}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentColor } as any}
                >
                  {PARTNER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PARTNER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full text-white font-bold py-4 rounded-[1.5rem] mt-6 transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md text-[15px]" style={{ backgroundColor: accentColor }}>
                Crear marca
              </button>
            </form>
          </div>
        </OverlayModal>
      )}

      {composingTo && (
        <OverlayModal tone="slate" onClose={closeComposer}>
          <div className={modalPanelClass}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Mensaje para {composingTo.contact.name}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">{composingTo.partner.name}</p>
              </div>
              <button onClick={closeComposer} aria-label="Cerrar modal" className="text-slate-400 dark:text-slate-500 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90 transition-transform hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20} /></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Usar plantilla</label>
                <select 
                  value={selectedTemplateId} 
                  onChange={e => handleTemplateSelect(e.target.value)}
                  className={fieldClass}
                  style={{ '--tw-ring-color': accentColor } as any}
                >
                  <option value="">Selecciona una plantilla</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {selectedTemplateId && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Asunto</label>
                    <input 
                      value={messagePreview.subject} 
                      onChange={e => setMessagePreview({...messagePreview, subject: e.target.value})}
                      className={fieldClass}
                      style={{ '--tw-ring-color': accentColor } as any} 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Mensaje</label>
                    <textarea 
                      value={messagePreview.body} 
                      onChange={e => setMessagePreview({...messagePreview, body: e.target.value})}
                      className={`${fieldClass} min-h-[160px]`}
                      style={{ '--tw-ring-color': accentColor } as any} 
                    />
                  </div>
                  <button 
                    onClick={handleSend}
                    className="w-full text-white font-bold py-4 rounded-[1.5rem] mt-4 transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-[15px]" 
                    style={{ backgroundColor: accentColor }}
                  >
                    <Send size={20} />
                    Abrir en correo
                  </button>
                </>
              )}
            </div>
          </div>
        </OverlayModal>
      )}

      {/* Add Contact Modal */}
      {addingContactTo && (
        <OverlayModal tone="slate" onClose={() => setAddingContactTo(null)}>
          <div className={modalPanelClass}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Nuevo contacto</h2>
              <button onClick={() => setAddingContactTo(null)} aria-label="Cerrar modal" className="text-slate-400 dark:text-slate-500 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90 transition-transform hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Nombre</label>
                <input required value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="e.g. Juan Pérez" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Rol</label>
                <input required value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="e.g. PR Manager" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Email</label>
                <input type="email" required value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="juan@brand.com" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Instagram</label>
                <input value={newContact.ig} onChange={e => setNewContact({...newContact, ig: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="@juanperez" />
              </div>
              <button type="submit" className="w-full text-white font-bold py-4 rounded-[1.5rem] mt-6 transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md text-[15px]" style={{ backgroundColor: accentColor }}>
                Guardar contacto
              </button>
            </form>
          </div>
        </OverlayModal>
      )}
      {/* Edit Contact Modal */}
      {editingContact && (
        <OverlayModal tone="slate" onClose={() => setEditingContact(null)}>
          <div className={modalPanelClass}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Editar contacto</h2>
              <button onClick={() => setEditingContact(null)} aria-label="Cerrar modal" className="text-slate-400 dark:text-slate-500 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full active:scale-90 transition-transform hover:bg-slate-200 dark:hover:bg-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditContact} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Nombre</label>
                <input required value={editingContact.contact.name} onChange={e => setEditingContact({...editingContact, contact: {...editingContact.contact, name: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="e.g. Juan Pérez" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Rol</label>
                <input required value={editingContact.contact.role} onChange={e => setEditingContact({...editingContact, contact: {...editingContact.contact, role: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="e.g. PR Manager" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Email</label>
                <input required type="email" value={editingContact.contact.email} onChange={e => setEditingContact({...editingContact, contact: {...editingContact.contact, email: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="juan@example.com" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Instagram</label>
                <input required value={editingContact.contact.ig} onChange={e => setEditingContact({...editingContact, contact: {...editingContact.contact, ig: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] px-5 py-4 text-[15px] font-medium focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100" style={{ '--tw-ring-color': accentColor } as any} placeholder="@juanperez" />
              </div>
              <button type="submit" className="w-full text-white font-bold py-4 rounded-[1.5rem] mt-6 transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md text-[15px]" style={{ backgroundColor: accentColor }}>
                Guardar cambios
              </button>
            </form>
          </div>
        </OverlayModal>
      )}
    </div>
  );
}
