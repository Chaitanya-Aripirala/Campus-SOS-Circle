import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  MapPin,
  PhoneCall,
  Loader2,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  action?: 'ACTIVATE_SOS' | 'VIEW_MAP' | 'CALL_SECURITY' | null;
}

interface CircleAIChatbotProps {
  onOpenSOS: () => void;
  onOpenMap: () => void;
  onOpenContacts: () => void;
}

export const CircleAIChatbot: React.FC<CircleAIChatbotProps> = ({ onOpenSOS, onOpenMap, onOpenContacts }) => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        'Hello! I am Circle AI, your campus safety assistant at Anurag University. How can I assist your safety today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterChips = [
    'Where is the nearest AED?',
    'Emergency helpline numbers?',
    'How do I report harassment?',
    'I feel unsafe walking to the hostel',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: query.trim() }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          context: {
            name: user?.name,
            role: user?.role,
            lat: 17.4206,
            lng: 78.6558,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: data.reply,
            action: data.action,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: data.reply || 'Campus safety helpline is active 24/7 at +91-8415-255555.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'I am experiencing network connectivity issues. For urgent help, please trigger the SOS button or call +91-8415-255555.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2.5 border border-white/20"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </div>
          <span className="font-bold text-sm hidden sm:inline-block tracking-tight">Circle AI</span>
        </button>
      )}

      {/* Floating Chat Drawer/Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md h-[550px] max-h-[88vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm text-white">Circle AI Safety Bot</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Gemini 2.5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Anurag University Safety Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Emergency Safety Notice */}
          <div className="px-3 py-2 bg-rose-950/40 border-b border-rose-800/40 text-[11px] text-rose-200 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Immediate danger?</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSOS();
              }}
              className="font-bold text-rose-300 underline hover:text-white"
            >
              Trigger SOS Now
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-inner'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{m.content}</p>

                  {/* Interactive Action Recommendation from Gemini */}
                  {m.action && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                      {m.action === 'ACTIVATE_SOS' && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onOpenSOS();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center space-x-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Trigger SOS</span>
                        </button>
                      )}
                      {m.action === 'VIEW_MAP' && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onOpenMap();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center space-x-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Open Campus Map</span>
                        </button>
                      )}
                      {m.action === 'CALL_SECURITY' && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onOpenContacts();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Campus Helplines</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-cyan-400 text-xs pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Circle AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {starterChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask safety bot or find help..."
              className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
