import React, { useState } from 'react';
import { EmergencyContact } from '../types';
import {
  PhoneCall,
  Search,
  X,
  Shield,
  HeartPulse,
  Flame,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts?: EmergencyContact[];
}

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'c1',
    title: 'Anurag Campus Security Control Desk',
    phone: '+91-8415-255555',
    description: '24/7 Central security control room at Main Gate 1 for all campus threats & escorts',
    category: 'Security',
    is24x7: true,
  },
  {
    id: 'c2',
    title: 'Anurag Health & Medical Center',
    phone: '+91-8415-255556',
    description: 'Campus emergency clinic with resident doctor & dedicated campus ambulance',
    category: 'Medical',
    is24x7: true,
  },
  {
    id: 'c3',
    title: "Women's Safety & Anti-Harassment Cell",
    phone: '+91-99887-11223',
    description: 'Internal Complaints Committee & female security rapid intervention unit',
    category: 'Helpline',
    is24x7: true,
  },
  {
    id: 'c4',
    title: 'Ghatkesar Police Station (Local Jurisdiction)',
    phone: '112',
    description: 'Emergency response police dispatch for Anurag University Ghatkesar jurisdiction',
    category: 'Police',
    is24x7: true,
  },
  {
    id: 'c5',
    title: 'Fire & Rescue Emergency Response',
    phone: '101',
    description: 'Fire hazard, smoke alert, chemical or electrical lab fire emergency',
    category: 'Fire',
    is24x7: true,
  },
  {
    id: 'c6',
    title: 'National Anti-Ragging 24/7 Helpline',
    phone: '1800-180-5522',
    description: 'Strict zero-tolerance anti-ragging national cell & UGC monitoring',
    category: 'Helpline',
    is24x7: true,
  },
  {
    id: 'c7',
    title: 'Campus Student Mental Health & Counselor',
    phone: '+91-8415-255560',
    description: 'Confidential crisis counseling, anxiety support & student wellbeing counselor',
    category: 'Medical',
    is24x7: false,
  },
  {
    id: 'c8',
    title: 'Campus Chief Security Officer',
    phone: '+91-94401-23456',
    description: 'Director of campus security, asset protection & incident escalation',
    category: 'Administration',
    is24x7: true,
  },
];

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
  contacts = DEFAULT_CONTACTS,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Security', 'Medical', 'Helpline', 'Police', 'Fire', 'Administration'];

  const filtered = contacts.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Campus Emergency Directory</h2>
              <p className="text-xs text-slate-400">Tap-to-call immediate campus and emergency authorities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search helpline name, phone number, or topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Grid / List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No contacts found matching your search criteria.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        item.category === 'Medical'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : item.category === 'Security'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : item.category === 'Fire'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-900 text-cyan-300 border-slate-700'
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.is24x7 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>24/7 Available</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-white">{item.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-lg">{item.description}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="font-mono text-xs font-bold text-cyan-400">{item.phone}</span>
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Helpline</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Official Anurag University Emergency Network</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
