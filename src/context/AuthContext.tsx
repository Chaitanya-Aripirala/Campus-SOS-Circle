import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  registerStudentWithFirebase,
  loginWithFirebase,
  logoutWithFirebase,
  demoLoginWithFirebase,
  signInWithGoogle,
  validateCollegeEmail,
  RegistrationInput,
} from '../firebase/authService';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegistrationInput) => Promise<{ success: boolean; message: string }>;
  googleLogin: () => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: Role) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('campus_sos_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campus_sos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('campus_sos_token', idToken);

          // Retrieve user profile from Cloud Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const email = data.email || fbUser.email || '';
            const appUser: User = {
              _id: fbUser.uid,
              name: data.name || fbUser.displayName || 'Campus User',
              email,
              role: (data.role as Role) || 'Student',
              rollNumber: data.rollNumber || email.split('@')[0].toUpperCase(),
              department: data.department || 'Engineering',
              year: data.year || 'Student',
              phone: data.phone || '',
              profileImage: data.profileImage || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
              isActive: data.isActive !== false,
              isAvailable: data.isAvailable !== false,
              currentLocation: data.currentLocation || { type: 'Point', coordinates: [78.6558, 17.4206] },
              createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
              updatedAt: data.updatedAt ? String(data.updatedAt) : new Date().toISOString(),
            };
            setUser(appUser);
            localStorage.setItem('campus_sos_user', JSON.stringify(appUser));
          } else {
            const email = fbUser.email || '';
            const role: Role = email.includes('admin')
              ? 'Admin'
              : email.includes('security')
              ? 'Security'
              : email.includes('responder')
              ? 'Responder'
              : 'Student';

            const appUser: User = {
              _id: fbUser.uid,
              name: fbUser.displayName || 'Campus Member',
              email,
              role,
              rollNumber: email.split('@')[0].toUpperCase(),
              department: 'General',
              year: 'Student',
              phone: '',
              profileImage: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
              isActive: true,
              isAvailable: true,
              currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setUser(appUser);
            localStorage.setItem('campus_sos_user', JSON.stringify(appUser));
          }
        } catch (error) {
          console.error('[AuthContext] Error loading user profile from Firestore:', error);
        }
      } else {
        // If not in Firebase Auth, check if we have an active local token/user session
        const cachedUser = localStorage.getItem('campus_sos_user');
        const cachedToken = localStorage.getItem('campus_sos_token');
        if (!cachedUser || !cachedToken) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await loginWithFirebase(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('campus_sos_user', JSON.stringify(res.user));
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('campus_sos_token', idToken);
      }
    }
    setIsLoading(false);
    return { success: res.success, message: res.message };
  };

  const register = async (formData: RegistrationInput) => {
    setIsLoading(true);

    // Explicit early domain check
    const validation = validateCollegeEmail(formData.email);
    if (!validation.isValid) {
      setIsLoading(false);
      return { success: false, message: validation.message };
    }

    const res = await registerStudentWithFirebase(formData);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('campus_sos_user', JSON.stringify(res.user));
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('campus_sos_token', idToken);
      }
    }
    setIsLoading(false);
    return { success: res.success, message: res.message };
  };

  const googleLogin = async () => {
    setIsLoading(true);
    const res = await signInWithGoogle();
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('campus_sos_user', JSON.stringify(res.user));
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('campus_sos_token', idToken);
      }
    }
    setIsLoading(false);
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutWithFirebase();
    setUser(null);
    setToken(null);
    localStorage.removeItem('campus_sos_token');
    localStorage.removeItem('campus_sos_user');
    setIsLoading(false);
  };

  const quickDemoLogin = async (role: Role) => {
    setIsLoading(true);
    const res = await demoLoginWithFirebase(role);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('campus_sos_user', JSON.stringify(res.user));
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('campus_sos_token', idToken);
      }
    }
    setIsLoading(false);
  };

  const updateUser = async (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('campus_sos_user', JSON.stringify(updated));
      return updated;
    });

    if (user?._id) {
      try {
        const docRef = doc(db, 'users', user._id);
        await updateDoc(docRef, {
          ...updatedData,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[AuthContext] Update user firestore sync warning:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        quickDemoLogin,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
