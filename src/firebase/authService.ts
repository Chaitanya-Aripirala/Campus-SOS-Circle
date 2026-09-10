import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import { User, Role } from '../types';

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  rollNumber?: string;
  department?: string;
  year?: string;
  phone?: string;
}

// Validation helper for college email domain
export function validateCollegeEmail(email: string): { isValid: boolean; message: string } {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Official college email is required.' };
  }

  const clean = email.trim().toLowerCase();

  // 1. Must end with official Anurag domain
  if (!clean.endsWith('@anurag.edu.in')) {
    return {
      isValid: false,
      message: 'Registration is restricted strictly to official Anurag University emails ending with @anurag.edu.in (e.g. 23eg105a50@anurag.edu.in).',
    };
  }

  // 2. Validate student roll number structure before @anurag.edu.in
  const localPart = clean.split('@')[0];
  if (!localPart || localPart.length < 3) {
    return {
      isValid: false,
      message: 'Invalid roll number format before @anurag.edu.in.',
    };
  }

  return { isValid: true, message: 'Valid official college email.' };
}

// Password Strength Validator
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one numerical digit (0-9).' };
  }
  return { isValid: true, message: 'Password is secure.' };
}

// Friendly error message mapper for Firebase errors
export function mapFirebaseError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this college email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email format is invalid. Please check and retry.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters including uppercase, lowercase, and numbers.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials or register an account.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in provider is not enabled in Firebase project. Please enable Email/Password in Firebase Console or use Google Sign-in / Fast Role Sandbox.';
    case 'auth/user-disabled':
      return 'This campus safety account has been disabled. Please contact the security control room.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily restricted for safety. Please try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Network connectivity failure. Please verify your internet connection and try again.';
    case 'permission-denied':
      return 'Access denied by campus security rules. You can only view and modify your authorized data.';
    default:
      if (msg.includes('operation-not-allowed')) {
        return 'Email/Password sign-in is not enabled in Firebase Console. You can use Google Sign-in or Fast Role Sandbox.';
      }
      if (msg.includes('offline') || msg.includes('network')) {
        return 'Network error communicating with Firebase. Please check your internet connection.';
      }
      return msg || 'An unexpected authentication error occurred.';
  }
}

// Register a Student with Firebase Auth & Cloud Firestore
export async function registerStudentWithFirebase(data: RegistrationInput): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  // 1. Validate email
  const emailValidation = validateCollegeEmail(data.email);
  if (!emailValidation.isValid) {
    return { success: false, message: emailValidation.message };
  }

  // 2. Validate password
  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isValid) {
    return { success: false, message: passwordValidation.message };
  }

  const cleanEmail = data.email.trim().toLowerCase();
  const rollNumber = (data.rollNumber || cleanEmail.split('@')[0]).toUpperCase();

  try {
    let fbUid: string | null = null;

    try {
      // 3. Attempt creation in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      fbUid = cred.user.uid;
      try {
        await updateProfile(cred.user, { displayName: data.name.trim() });
      } catch {
        // non-fatal
      }
    } catch (authErr: any) {
      const code = authErr?.code || '';
      const msg = authErr?.message || '';

      // If Firebase Auth Email/Password provider is not yet enabled in the Firebase Console
      if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        console.warn('[Firebase Auth] auth/operation-not-allowed encountered. Registering profile securely via Cloud Firestore backend API...');
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            email: cleanEmail,
            password: data.password,
            rollNumber,
            department: data.department || 'Computer Science & Engineering',
            year: data.year || '3rd Year',
            phone: data.phone?.trim() || '',
          }),
        });

        const json = await res.json();
        if (json.success && json.user) {
          if (json.token) {
            localStorage.setItem('campus_sos_token', json.token);
          }
          localStorage.setItem('campus_sos_user', JSON.stringify(json.user));
          return {
            success: true,
            message: 'Student account successfully registered and stored in Cloud Firestore!',
            user: json.user,
          };
        } else {
          return {
            success: false,
            message: json.message || 'Registration failed.',
          };
        }
      }

      // Re-throw other auth errors (e.g. duplicate email)
      throw authErr;
    }

    // 4. Store user profile in Cloud Firestore
    const userDocRef = doc(db, 'users', fbUid);
    const profileData = {
      uid: fbUid,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'Student' as Role,
      rollNumber,
      department: data.department || 'Computer Science & Engineering',
      year: data.year || '3rd Year',
      phone: data.phone?.trim() || '',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, profileData);

    // 5. Store private PII subcollection (protected by security rules)
    try {
      const privateDocRef = doc(db, 'users', fbUid, 'private', 'info');
      await setDoc(privateDocRef, {
        phone: data.phone?.trim() || '',
        email: cleanEmail,
        emergencyContact: '',
        updatedAt: serverTimestamp(),
      });
    } catch (piiErr) {
      console.warn('[Firebase] Non-fatal private subcollection write:', piiErr);
    }

    const appUser: User = {
      _id: fbUid,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'Student',
      rollNumber,
      department: data.department || 'Computer Science & Engineering',
      year: data.year || '3rd Year',
      phone: data.phone?.trim() || '',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('campus_sos_user', JSON.stringify(appUser));

    return {
      success: true,
      message: 'Student account successfully registered and activated on Firebase!',
      user: appUser,
    };
  } catch (error) {
    console.error('[Firebase] Registration error:', error);
    return {
      success: false,
      message: mapFirebaseError(error),
    };
  }
}

// Sign in with Firebase Authentication
export async function loginWithFirebase(
  email: string,
  pass: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    let fbUid: string | null = null;
    let fbDisplayName: string | null = null;

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      fbUid = cred.user.uid;
      fbDisplayName = cred.user.displayName;
    } catch (authErr: any) {
      const code = authErr?.code || '';
      const msg = authErr?.message || '';

      if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        console.warn('[Firebase Auth] auth/operation-not-allowed encountered. Authenticating via Cloud Firestore backend API...');
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: pass }),
        });
        const json = await res.json();
        if (json.success && json.user) {
          if (json.token) {
            localStorage.setItem('campus_sos_token', json.token);
          }
          localStorage.setItem('campus_sos_user', JSON.stringify(json.user));
          return {
            success: true,
            message: json.message || `Welcome back, ${json.user.name}!`,
            user: json.user,
          };
        } else {
          return {
            success: false,
            message: json.message || 'Invalid college email or password.',
          };
        }
      }

      throw authErr;
    }

    // Fetch user profile from Cloud Firestore
    const userDocRef = doc(db, 'users', fbUid!);
    const snap = await getDoc(userDocRef);

    let userProfile: User;

    if (snap.exists()) {
      const data = snap.data();
      userProfile = {
        _id: fbUid!,
        name: data.name || fbDisplayName || 'Campus User',
        email: data.email || cleanEmail,
        role: (data.role as Role) || 'Student',
        rollNumber: data.rollNumber || cleanEmail.split('@')[0].toUpperCase(),
        department: data.department || 'Engineering',
        year: data.year || 'Student',
        phone: data.phone || '',
        profileImage: data.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        isActive: data.isActive !== false,
        isAvailable: data.isAvailable !== false,
        currentLocation: data.currentLocation || { type: 'Point', coordinates: [78.6558, 17.4206] },
        createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
        updatedAt: data.updatedAt ? String(data.updatedAt) : new Date().toISOString(),
      };
    } else {
      // Fallback profile if Firestore doc was not seeded yet
      const role: Role = cleanEmail.includes('admin')
        ? 'Admin'
        : cleanEmail.includes('security')
        ? 'Security'
        : cleanEmail.includes('responder')
        ? 'Responder'
        : 'Student';

      userProfile = {
        _id: fbUid!,
        name: fbDisplayName || (role === 'Admin' ? 'Campus Admin Officer' : role === 'Security' ? 'Security Guard' : 'Campus Student'),
        email: cleanEmail,
        role,
        rollNumber: cleanEmail.split('@')[0].toUpperCase(),
        department: role === 'Student' ? 'Computer Science' : 'Safety & Operations',
        year: role === 'Student' ? '3rd Year' : 'Staff',
        phone: '',
        profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        isActive: true,
        isAvailable: true,
        currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(userDocRef, {
          uid: fbUid,
          ...userProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }

    localStorage.setItem('campus_sos_user', JSON.stringify(userProfile));

    return {
      success: true,
      message: `Welcome back, ${userProfile.name}!`,
      user: userProfile,
    };
  } catch (error) {
    console.error('[Firebase] Sign-in error:', error);
    return {
      success: false,
      message: mapFirebaseError(error),
    };
  }
}

// Google Sign-In with official Anurag domain
export async function signInWithGoogle(): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    const cleanEmail = (fbUser.email || '').toLowerCase().trim();

    // Check college domain
    if (!cleanEmail.endsWith('@anurag.edu.in')) {
      await signOut(auth);
      return {
        success: false,
        message: 'Google Sign-in is strictly restricted to official Anurag University (@anurag.edu.in) accounts.',
      };
    }

    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);
    let userProfile: User;

    if (snap.exists()) {
      const data = snap.data();
      userProfile = {
        _id: fbUser.uid,
        name: data.name || fbUser.displayName || 'Campus User',
        email: cleanEmail,
        role: (data.role as Role) || 'Student',
        rollNumber: data.rollNumber || cleanEmail.split('@')[0].toUpperCase(),
        department: data.department || 'Engineering',
        year: data.year || 'Student',
        phone: data.phone || '',
        profileImage: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        isActive: data.isActive !== false,
        isAvailable: data.isAvailable !== false,
        currentLocation: data.currentLocation || { type: 'Point', coordinates: [78.6558, 17.4206] },
        createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
        updatedAt: data.updatedAt ? String(data.updatedAt) : new Date().toISOString(),
      };
    } else {
      userProfile = {
        _id: fbUser.uid,
        name: fbUser.displayName || 'Campus Student',
        email: cleanEmail,
        role: 'Student',
        rollNumber: cleanEmail.split('@')[0].toUpperCase(),
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        phone: '',
        profileImage: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        isActive: true,
        isAvailable: true,
        currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, {
        uid: fbUser.uid,
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    localStorage.setItem('campus_sos_user', JSON.stringify(userProfile));

    return {
      success: true,
      message: `Signed in as ${userProfile.name}!`,
      user: userProfile,
    };
  } catch (err: any) {
    console.error('[Firebase] Google sign-in error:', err);
    return {
      success: false,
      message: mapFirebaseError(err),
    };
  }
}

// Sign out from Firebase
export async function logoutWithFirebase(): Promise<void> {
  localStorage.removeItem('campus_sos_user');
  localStorage.removeItem('campus_sos_token');
  await signOut(auth);
}

// Demo quick-login helper that ensures Firebase account exists and logs in
export async function demoLoginWithFirebase(role: Role): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  const DEMO_USERS: Record<Role, { email: string; pass: string; name: string; dept: string; year: string; phone: string }> = {
    Student: {
      email: '23eg105a50@anurag.edu.in',
      pass: 'Student@1234',
      name: 'Chaitanya Aripirala',
      dept: 'Computer Science & Engineering',
      year: '3rd Year',
      phone: '+91-9849011111',
    },
    Responder: {
      email: 'responder1@anurag.edu.in',
      pass: 'Responder@1234',
      name: 'Dr. Priya Sharma (Medical)',
      dept: 'Campus Health Centre',
      year: 'Medical Officer',
      phone: '+91-9876543210',
    },
    Security: {
      email: 'security@anurag.edu.in',
      pass: 'Security@1234',
      name: 'Inspector Rajesh Varma',
      dept: 'Campus Central Security Wing',
      year: 'Chief Guard',
      phone: '+91-9849054321',
    },
    Admin: {
      email: 'admin@anurag.edu.in',
      pass: 'Admin@1234',
      name: 'Campus Safety Admin Officer',
      dept: 'Campus Safety & Administration',
      year: 'Directorate',
      phone: '+91-9849012345',
    },
  };

  const demo = DEMO_USERS[role];
  if (!demo) {
    return { success: false, message: 'Unknown demo role' };
  }

  // 1. Try signing in first
  const loginRes = await loginWithFirebase(demo.email, demo.pass);
  if (loginRes.success && loginRes.user) {
    return loginRes;
  }

  // 2. If login failed, try backend login endpoint
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demo.email, password: demo.pass }),
    });
    const json = await res.json();
    if (json.success && json.user) {
      if (json.token) {
        localStorage.setItem('campus_sos_token', json.token);
      }
      localStorage.setItem('campus_sos_user', JSON.stringify(json.user));
      return {
        success: true,
        message: `Demo signed in as ${demo.name} (${role})`,
        user: json.user,
      };
    }
  } catch (apiErr) {
    console.warn('[Demo Login] API fallback notice:', apiErr);
  }

  // 3. If user does not exist in Firebase Auth yet, attempt creation
  try {
    const cred = await createUserWithEmailAndPassword(auth, demo.email, demo.pass);
    const fbUser = cred.user;

    const userProfile: User = {
      _id: fbUser.uid,
      name: demo.name,
      email: demo.email,
      role,
      rollNumber: demo.email.split('@')[0].toUpperCase(),
      department: demo.dept,
      year: demo.year,
      phone: demo.phone,
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${demo.email}`,
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userDocRef = doc(db, 'users', fbUser.uid);
    await setDoc(userDocRef, {
      uid: fbUser.uid,
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    localStorage.setItem('campus_sos_user', JSON.stringify(userProfile));

    return {
      success: true,
      message: `Demo signed in as ${demo.name} (${role})`,
      user: userProfile,
    };
  } catch (createErr) {
    // If creation failed because user exists or auth restricted, retry login
    return await loginWithFirebase(demo.email, demo.pass);
  }
}
