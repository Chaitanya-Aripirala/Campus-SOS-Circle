import React, { useState } from 'react';
import { CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  defaultNotes?: string;
  actionLabel?: string;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  title,
  subtitle,
  defaultNotes = '',
  actionLabel = 'Submit Update',
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState(defaultNotes);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Resolution / Action Report Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Student attended, situation safe, first-aid administered..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
