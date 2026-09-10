import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IncidentCategory, IncidentPriority } from '../types';
import {
  FileText,
  X,
  Camera,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentReported: (inc: any) => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onIncidentReported,
}) => {
  const { token, user } = useAuth();

  const [category, setCategory] = useState<IncidentCategory>('Security');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('B-Block Library Area');
  const [priority, setPriority] = useState<IncidentPriority>('Medium');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  if (!isOpen) return null;

  const categories: IncidentCategory[] = [
    'Security',
    'Infrastructure',
    'Harassment',
    'Cleanliness',
    'Medical',
    'Lost & Found',
    'Other',
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAiTriage = async () => {
    if (!description.trim()) return;
    setAiClassifying(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description, categorySuggestion: category }),
      });
      const data = await res.json();
      if (data.success && data.classification) {
        setAiSuggestion(data.classification);
        if (data.classification.category && categories.includes(data.classification.category as any)) {
          setCategory(data.classification.category as any);
        }
        if (data.classification.severity === 'Critical') setPriority('Urgent');
        else if (data.classification.severity === 'High') setPriority('High');
      }
    } catch (e) {
      // ignore
    } finally {
      setAiClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.url) {
          uploadedUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          locationName,
          imageUrl: uploadedUrl,
          latitude: 17.4206,
          longitude: 78.6558,
        }),
      });

      const data = await res.json();
      if (data.success && data.incident) {
        onIncidentReported(data.incident);
        onClose();
      } else {
        alert(data.message || 'Failed to submit report');
      }
    } catch (err) {
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Report Campus Incident</h2>
              <p className="text-xs text-slate-400">Non-emergency campus concerns & maintenance safety</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Category Selection */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    category === cat
                      ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Urgent'] as IncidentPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    priority === p
                      ? p === 'Urgent'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : p === 'High'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Incident Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Streetlight out near Boys Hostel Gate 2"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Location Landmark */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Specific Campus Landmark
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., A-Block Ground Floor washroom corridor"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Detailed Description
              </label>
              <button
                type="button"
                onClick={handleAiTriage}
                disabled={aiClassifying || !description.trim()}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiClassifying ? 'Analyzing...' : 'AI Auto-Classify'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly. Mention any immediate safety concerns or hazards..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          {/* AI Triage Feedback Banner if triggered */}
          {aiSuggestion && (
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini AI Safety Triage</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {aiSuggestion.summary || aiSuggestion.recommendedHandling}
              </p>
            </div>
          )}

          {/* Photo Evidence Upload */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-1">
              Photo Evidence (Optional)
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs flex items-center space-x-2 transition-all">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Choose Photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700">
                  <img src={imagePreview} alt="Evidence Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Incident Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
