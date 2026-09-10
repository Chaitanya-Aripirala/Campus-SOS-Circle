import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOSRequest, Incident } from '../types';

export interface ToastAlert {
  id: string;
  type: 'emergency' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeEmergencies: SOSRequest[];
  latestSOS: SOSRequest | null;
  toasts: ToastAlert[];
  soundEnabled: boolean;
  toggleSound: () => void;
  addToast: (toast: Omit<ToastAlert, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
  playAlertTone: (type?: 'emergency' | 'chime') => void;
  refreshActiveSOS: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Web Audio API Sound Synthesizer (No external audio files required, zero latency)
function playTone(type: 'emergency' | 'chime' = 'emergency') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'emergency') {
      // 2-tone urgent emergency siren sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Gentle confirmation chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // AudioContext autoplay restrictions or disabled
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeEmergencies, setActiveEmergencies] = useState<SOSRequest[]>([]);
  const [latestSOS, setLatestSOS] = useState<SOSRequest | null>(null);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const toggleSound = () => setSoundEnabled((prev) => !prev);

  const addToast = (toast: Omit<ToastAlert, 'id' | 'timestamp'>) => {
    const newToast: ToastAlert = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 5)]);

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 7000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshActiveSOS = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sos/active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sosList)) {
        setActiveEmergencies(data.sosList);
      }
    } catch (e) {
      // ignore
    }
  };

  // Fetch active SOS on login
  useEffect(() => {
    if (token) {
      refreshActiveSOS();
    } else {
      setActiveEmergencies([]);
    }
  }, [token]);

  // Setup Socket.IO connection
  useEffect(() => {
    const s = io({
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('[SocketClient] Connected to Campus SOS Circle real-time network');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('sos:created', (newSOS: SOSRequest) => {
      setLatestSOS(newSOS);
      setActiveEmergencies((prev) => [newSOS, ...prev.filter((item) => item._id !== newSOS._id)]);

      if (soundRef.current) {
        playTone('emergency');
      }

      addToast({
        type: 'emergency',
        title: `🚨 EMERGENCY SOS: ${newSOS.type.toUpperCase()}`,
        message: `${newSOS.userName} requested help near ${newSOS.location?.addressName || 'Campus'}!`,
        data: newSOS,
      });
    });

    s.on('sos:status_changed', (payload: { sosId: string; sos: SOSRequest; newStatus: string; note?: string }) => {
      const updated = payload.sos;
      if (updated) {
        setLatestSOS(updated);
        setActiveEmergencies((prev) => {
          if (updated.status === 'RESOLVED' || updated.status === 'CANCELLED') {
            return prev.filter((item) => item._id !== updated._id);
          }
          return prev.map((item) => (item._id === updated._id ? updated : item));
        });

        if (soundRef.current) {
          playTone('chime');
        }

        addToast({
          type: updated.status === 'RESOLVED' ? 'success' : 'info',
          title: `SOS Update: ${updated.status.replace(/_/g, ' ')}`,
          message: payload.note || `Status is now ${updated.status}`,
          data: updated,
        });
      }
    });

    s.on('incident:created', (newInc: Incident) => {
      addToast({
        type: 'warning',
        title: `New Incident: ${newInc.category}`,
        message: `${newInc.title} reported at ${newInc.locationName}`,
        data: newInc,
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeEmergencies,
        latestSOS,
        toasts,
        soundEnabled,
        toggleSound,
        addToast,
        dismissToast,
        playAlertTone: playTone,
        refreshActiveSOS,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
