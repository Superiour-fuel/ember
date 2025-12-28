import React, { useState, useEffect } from 'react';
import { Phone, Plus, Trash2, Users, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCaregiverContacts,
  saveCaregiverContact,
  removeCaregiverContact,
  toggleCaregiverActive,
  CaregiverContact,
} from '@/services/caregiverService';
import { useToast } from '@/hooks/use-toast';

function BrutalistSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-8 h-4 rounded-full border border-black flex items-center px-0.5 transition-colors relative ${checked ? 'bg-black' : 'bg-white'}`}
    >
      <div className={`w-3 h-3 bg-white border border-black rounded-full transition-transform ${checked ? 'translate-x-[1.1rem] bg-[#4ade80]' : 'translate-x-0 bg-gray-200'}`} />
    </button>
  );
}

export function CaregiverContacts() {
  const [contacts, setContacts] = useState<CaregiverContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const { toast } = useToast();

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = () => setContacts(getCaregiverContacts());

  const handleAdd = () => {
    if (!newContact.name || !newContact.phone) {
      toast({ title: 'Missing information', description: 'Name and phone required', variant: 'destructive' });
      return;
    }
    saveCaregiverContact(newContact.name, newContact.phone, newContact.relationship);
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAdd(false);
    loadContacts();
    toast({ title: 'Contact added', description: `${newContact.name} will receive alerts` });
  };

  const handleRemove = (id: number) => {
    if (confirm("Remove this contact?")) {
      removeCaregiverContact(id);
      loadContacts();
    }
  };

  return (
    <div className="space-y-3">
      {/* Context Banner */}
      <div className="bg-yellow-50 border-2 border-black rounded-xl p-3 flex gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black text-white p-2 rounded-lg h-fit">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase mb-1">Emergency Context</h4>
          <p className="text-[10px] font-bold text-gray-600 leading-tight">
            When you say "Help" or trigger an emergency, these contacts receive an instant SMS with your location and context.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-gray-400">Trusted Contacts</span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[10px] font-bold underline flex items-center gap-1 hover:text-green-600"
          >
            <Plus className="w-3 h-3" /> Add New
          </button>
        </div>

        {contacts.length === 0 && !showAdd ? (
          <div className="border-2 border-dashed border-black/20 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-gray-400">No contacts added yet</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs ring-2 ring-white ring-offset-2 ring-offset-black/10">
                  {contact.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black">{contact.name}</p>
                    {contact.relationship && (
                      <span className="text-[8px] font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 uppercase">{contact.relationship}</span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono font-medium text-gray-500">{contact.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BrutalistSwitch
                  checked={contact.active}
                  onChange={() => { toggleCaregiverActive(contact.id); loadContacts(); }}
                />
                <button onClick={() => handleRemove(contact.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-black text-white p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] space-y-2 animate-in slide-in-from-top-2">
          <h4 className="text-xs font-black uppercase text-[#4ade80]">New Contact</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Name"
              className="h-8 text-xs bg-white text-black border-0 font-bold placeholder:text-gray-400"
            />
            <Input
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              placeholder="Phone"
              className="h-8 text-xs bg-white text-black border-0 font-bold placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              placeholder="Relationship (Optional)"
              className="h-8 text-xs bg-white/20 text-white border-white/20 font-bold placeholder:text-white/50"
            />
            <Button onClick={handleAdd} size="sm" className="h-8 bg-[#4ade80] text-black font-black text-xs hover:bg-[#22c55e]">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
