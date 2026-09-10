import bcrypt from 'bcryptjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitTo,
  serverTimestamp,
} from 'firebase/firestore';
import { serverDb } from '../config/firebase';
import { IUser } from '../models/User';
import { ISOSRequest, SOSStatus, SOSType, SOSSeverity } from '../models/SOSRequest';
import { IIncident, IncidentCategory, IncidentPriority, IncidentStatus } from '../models/Incident';
import { ICampusLocation } from '../models/CampusLocation';
import { ISystemSettings, IEmergencyContact } from '../models/SystemSettings';
import { IAuditLog } from '../models/AuditLog';

// Calculate Haversine distance in meters between two lat/lng points
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// In-Memory state cache for low-latency lookups
interface InMemoryState {
  users: any[];
  sosRequests: any[];
  incidents: any[];
  locations: any[];
  settings: any;
  auditLogs: any[];
}

const memoryStore: InMemoryState = {
  users: [],
  sosRequests: [],
  incidents: [],
  locations: [],
  settings: null,
  auditLogs: [],
};

// Seed initial default data for both memory store and Cloud Firestore
export async function seedInitialData() {
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin@1234', salt);
  const securityPass = await bcrypt.hash('Security@1234', salt);
  const responderPass = await bcrypt.hash('Responder@1234', salt);
  const studentPass = await bcrypt.hash('Student@1234', salt);

  const initialUsers = [
    {
      _id: 'usr_admin_01',
      uid: 'usr_admin_01',
      name: 'Campus Admin Officer',
      email: 'admin@anurag.edu.in',
      passwordHash: adminPass,
      role: 'Admin',
      rollNumber: 'ADMIN-001',
      department: 'Campus Safety & Operations',
      year: 'Directorate',
      phone: '+91-9849012345',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6558, 17.4206] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_security_01',
      uid: 'usr_security_01',
      name: 'Inspector Rajesh Varma',
      email: 'security@anurag.edu.in',
      passwordHash: securityPass,
      role: 'Security',
      rollNumber: 'SEC-104',
      department: 'Campus Central Security Wing',
      year: 'Chief Guard',
      phone: '+91-9849054321',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6562, 17.4211] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_resp_01',
      uid: 'usr_resp_01',
      name: 'Dr. Priya Sharma (Medical)',
      email: 'responder1@anurag.edu.in',
      passwordHash: responderPass,
      role: 'Responder',
      rollNumber: 'MED-202',
      department: 'Campus Health Centre',
      year: 'Medical Officer',
      phone: '+91-9876543210',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6552, 17.4201] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_resp_02',
      uid: 'usr_resp_02',
      name: 'Arjun Reddy (First Responder)',
      email: 'responder2@anurag.edu.in',
      passwordHash: responderPass,
      role: 'Responder',
      rollNumber: 'RESP-08',
      department: 'Emergency Student Response Taskforce',
      year: 'Student Lead',
      phone: '+91-9123456789',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6565, 17.4215] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'usr_student_01',
      uid: 'usr_student_01',
      name: 'Chaitanya Aripirala',
      email: '23eg105a50@anurag.edu.in',
      passwordHash: studentPass,
      role: 'Student',
      rollNumber: '23EG105A50',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      phone: '+91-9849011111',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [78.6556, 17.4208] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialLocations = [
    {
      _id: 'loc_medical_01',
      name: '24/7 Campus Medical Center & Ward',
      type: 'Medical',
      description: 'Round-the-clock emergency medical ward with triage bay, ambulance bay, and basic life support (BLS).',
      location: { type: 'Point', coordinates: [78.6565, 17.4208] },
      building: 'Health & Wellness Block',
      floor: 'Ground Floor',
      room: 'Emergency Triage 01',
      contact: '+91-8415-255108',
      hours: '24 Hours Open',
      isActive: true,
    },
    {
      _id: 'loc_security_01',
      name: 'Central Campus Security & CCTV Control',
      type: 'Security',
      description: 'Main campus security command center, quick-response dispatch base, and surveillance monitor room.',
      location: { type: 'Point', coordinates: [78.6552, 17.4204] },
      building: 'Main Entrance Archway',
      floor: 'Ground Floor',
      room: 'Command Center',
      contact: '+91-8415-255555',
      hours: '24 Hours Open',
      isActive: true,
    },
    {
      _id: 'loc_gate1_01',
      name: 'Main Emergency Entrance & Gate 1',
      type: 'Gate',
      description: 'Primary vehicular entry and dedicated emergency medical vehicle clearance point.',
      location: { type: 'Point', coordinates: [78.6548, 17.4195] },
      building: 'Campus Perimeter',
      floor: 'Ground',
      room: 'Gate Guard House 1',
      contact: '+91-8415-255001',
      hours: '24 Hours Open',
      isActive: true,
    },
    {
      _id: 'loc_aed_01',
      name: 'Automated External Defibrillator (AED) - Block A',
      type: 'AED',
      description: 'Public-access cardiac defibrillator station with audio-guided CPR assistance instructions.',
      location: { type: 'Point', coordinates: [78.6559, 17.4212] },
      building: 'Engineering Block A',
      floor: '1st Floor Atrium',
      room: 'Emergency Pillar 02',
      contact: '+91-8415-255108',
      hours: 'Always Accessible',
      isActive: true,
    },
    {
      _id: 'loc_lib_01',
      name: 'Central University Library Safe Haven',
      type: 'Library',
      description: 'Monitored quiet refuge zone equipped with trauma kit, first-aid box, and direct emergency intercom.',
      location: { type: 'Point', coordinates: [78.6575, 17.4212] },
      building: 'Knowledge Center',
      floor: '1st Floor',
      room: 'Circulation Desk Helpdesk',
      contact: '+91-8415-255222',
      hours: '8:00 AM - 10:00 PM',
      isActive: true,
    },
  ];

  const initialSettings = {
    _id: 'settings_default',
    collegeName: 'Anurag University Campus Safety Directorate',
    studentEmailDomain: 'anurag.edu.in',
    studentEmailPattern: '{rollNumber}@anurag.edu.in',
    studentEmailRegex: '^[0-9]{2}[a-zA-Z0-9]{8}@anurag\\.edu\\.in$',
    allowSelfRegistration: true,
    sosCategories: ['Medical', 'Security', 'Accident', 'Fire', 'Harassment', 'Lost Person', 'Other'],
    emergencyContacts: [
      { id: 'ec_1', title: 'Campus Security Central Control (24/7)', phone: '+91-8415-255555', description: 'Immediate on-campus guard dispatch', category: 'Security', is24x7: true },
      { id: 'ec_2', title: 'Campus Medical Centre & Ambulance Desk', phone: '+91-8415-255108', description: 'Campus doctors, paramedic nurses, and ambulance', category: 'Medical', is24x7: true },
      { id: 'ec_3', title: 'Women Safety & Antiragging Committee', phone: '+91-8415-255999', description: 'Confidential harassment and women student helpline', category: 'Helpline', is24x7: true },
      { id: 'ec_4', title: 'Ghatkesar Police Station (Local Police)', phone: '+91-8415-222100', description: 'Jurisdictional police station support', category: 'Police', is24x7: true },
      { id: 'ec_5', title: 'Telangana Emergency Response Service', phone: '112', description: 'National emergency helpline (Police, Fire, Medical)', category: 'Police', is24x7: true },
    ],
    registrationAttempts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialIncidents = [
    {
      _id: 'inc_sample_01',
      userId: 'usr_student_01',
      userName: 'Chaitanya Aripirala',
      userEmail: '23eg105a50@anurag.edu.in',
      category: 'Infrastructure',
      title: 'Flickering Staircase Light - Block C North',
      description: 'The overhead lighting on the 2nd floor staircase is completely dark and malfunctioning, creating safety hazards during evening labs.',
      locationName: 'Engineering Block C, North Staircase',
      location: { type: 'Point', coordinates: [78.6568, 17.4209] },
      priority: 'Medium',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialSOS = [
    {
      _id: 'sos_sample_01',
      userId: 'usr_student_01',
      userName: 'Chaitanya Aripirala',
      userRollNumber: '23EG105A50',
      userPhone: '+91-9849011111',
      userEmail: '23eg105a50@anurag.edu.in',
      type: 'Medical' as SOSType,
      severity: 'Medium' as SOSSeverity,
      status: 'ACKNOWLEDGED' as SOSStatus,
      description: 'Minor sports injury near the basketball court. Need first aid kit.',
      location: {
        type: 'Point',
        coordinates: [78.6562, 17.4207] as [number, number],
        addressName: 'Near Basketball Court Complex',
      },
      statusHistory: [
        { status: 'PENDING', timestamp: new Date(Date.now() - 600000).toISOString(), note: 'Distress broadcasted by student' },
        { status: 'ACKNOWLEDGED', timestamp: new Date(Date.now() - 300000).toISOString(), note: 'Security central desk acknowledged' },
      ],
      createdAt: new Date(Date.now() - 600000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 300000).toISOString(),
    },
  ];

  // Populate memory cache
  memoryStore.users = initialUsers;
  memoryStore.locations = initialLocations;
  memoryStore.settings = initialSettings;
  memoryStore.incidents = initialIncidents;
  memoryStore.sosRequests = initialSOS;
  memoryStore.auditLogs = [];

  // Seed into Cloud Firestore
  try {
    const usersCol = collection(serverDb, 'users');
    const existingUsers = await getDocs(usersCol);
    if (existingUsers.empty) {
      for (const u of initialUsers) {
        await setDoc(doc(serverDb, 'users', u._id), u);
      }
      console.log('[Firestore] Seeded initial campus users into Cloud Firestore');
    }

    const locCol = collection(serverDb, 'locations');
    const existingLocs = await getDocs(locCol);
    if (existingLocs.empty) {
      for (const l of initialLocations) {
        await setDoc(doc(serverDb, 'locations', l._id), l);
      }
      console.log('[Firestore] Seeded campus safety facilities into Cloud Firestore');
    }

    const settingsDoc = await getDoc(doc(serverDb, 'settings', 'campus_config'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(serverDb, 'settings', 'campus_config'), initialSettings);
      console.log('[Firestore] Seeded system safety settings into Cloud Firestore');
    }
  } catch (err: any) {
    console.warn('[Firestore] Initial Firestore sync note:', err.message);
  }

  console.log('[Campus SOS] DataStore initialized successfully with Cloud Firestore & local cache.');
}

// Unified Data Access API
export const DataStore = {
  // USER METHODS
  async findUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    // Check memory first
    const cached = memoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (cached) return cached;

    // Query Firestore
    try {
      const q = query(collection(serverDb, 'users'), where('email', '==', cleanEmail), limitTo(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const user = { _id: snap.docs[0].id, ...data };
        memoryStore.users.push(user);
        return user;
      }
    } catch (err) {
      // ignore
    }
    return null;
  },

  async findUserById(id: string) {
    const cached = memoryStore.users.find((u) => String(u._id) === String(id) || String(u.uid) === String(id));
    if (cached) return cached;

    try {
      const docSnap = await getDoc(doc(serverDb, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const user = { _id: docSnap.id, ...data };
        memoryStore.users.push(user);
        return user;
      }
    } catch (err) {
      // ignore
    }
    return null;
  },

  async createUser(userData: any) {
    const uid = userData.uid || userData._id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cleanEmail = (userData.email || '').toLowerCase().trim();
    const newUser = {
      _id: uid,
      uid,
      isActive: true,
      isAvailable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData,
      email: cleanEmail,
    };

    memoryStore.users.push(newUser);

    try {
      await setDoc(doc(serverDb, 'users', uid), newUser);
    } catch (err: any) {
      console.warn('[Firestore] Write user notice:', err.message);
    }

    return newUser;
  },

  async updateUser(id: string, updateData: any) {
    const idx = memoryStore.users.findIndex((u) => String(u._id) === String(id) || String(u.uid) === String(id));
    let updatedObj = null;
    if (idx !== -1) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...updateData, updatedAt: new Date().toISOString() };
      updatedObj = memoryStore.users[idx];
    }

    try {
      await updateDoc(doc(serverDb, 'users', id), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      // ignore
    }

    return updatedObj;
  },

  async getAvailableResponders() {
    return memoryStore.users
      .filter((u) => (u.role === 'Responder' || u.role === 'Security') && u.isActive && u.isAvailable)
      .map(({ passwordHash, ...rest }) => rest);
  },

  async getAllUsers() {
    return memoryStore.users.map(({ passwordHash, ...rest }) => rest);
  },

  // SOS METHODS
  async createSOS(data: any) {
    const id = data._id || `sos_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newSOS = {
      _id: id,
      status: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          note: 'Distress alert raised by student',
        },
      ],
      createdAt: new Date().toISOString(),
      ...data,
    };

    memoryStore.sosRequests.unshift(newSOS);

    try {
      await setDoc(doc(serverDb, 'sosRequests', id), newSOS);
    } catch (err: any) {
      console.warn('[Firestore] Write SOS notice:', err.message);
    }

    return newSOS;
  },

  async getActiveSOSRequests() {
    const activeStatuses: SOSStatus[] = [
      'PENDING',
      'ACKNOWLEDGED',
      'ASSIGNED',
      'RESPONDER_ON_THE_WAY',
      'ARRIVED',
    ];
    return memoryStore.sosRequests.filter((s) => activeStatuses.includes(s.status));
  },

  async getAllSOS() {
    return memoryStore.sosRequests;
  },

  async findSOSById(id: string) {
    return memoryStore.sosRequests.find((s) => String(s._id) === String(id)) || null;
  },

  async getSOSByUserId(userId: string) {
    return memoryStore.sosRequests.filter((s) => s.userId === userId);
  },

  async getActiveSOS() {
    return this.getActiveSOSRequests();
  },

  async getSOSById(id: string) {
    return this.findSOSById(id);
  },

  async getSOSForUser(userId: string) {
    return this.getSOSByUserId(userId);
  },

  async assignResponderToSOS(id: string, responder: any) {
    return this.assignResponder(id, responder);
  },

  async updateSOSStatus(id: string, status: SOSStatus, note?: string, updatedBy?: string) {
    const sos = memoryStore.sosRequests.find((s) => String(s._id) === String(id));
    if (!sos) return null;

    sos.status = status;
    if (!sos.statusHistory) sos.statusHistory = [];
    sos.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
      updatedBy,
    });

    if (status === 'ACKNOWLEDGED' && !sos.acknowledgedAt) {
      sos.acknowledgedAt = new Date().toISOString();
    } else if (status === 'ASSIGNED' && !sos.assignedAt) {
      sos.assignedAt = new Date().toISOString();
    } else if (status === 'RESOLVED') {
      sos.resolvedAt = new Date().toISOString();
      if (note) sos.resolutionNotes = note;
    }

    try {
      await updateDoc(doc(serverDb, 'sosRequests', id), {
        status,
        notes: note || '',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // ignore
    }

    return sos;
  },

  async assignResponder(id: string, responder: { id: string; name: string; phone: string; role: string; distanceMeters?: number }) {
    const sos = memoryStore.sosRequests.find((s) => String(s._id) === String(id));
    if (!sos) return null;

    sos.status = 'ASSIGNED';
    sos.assignedResponder = responder;
    sos.assignedAt = new Date().toISOString();
    if (!sos.statusHistory) sos.statusHistory = [];
    sos.statusHistory.push({
      status: 'ASSIGNED',
      timestamp: new Date().toISOString(),
      note: `Responder dispatched: ${responder.name} (${responder.role})`,
      updatedBy: responder.name,
    });

    try {
      await updateDoc(doc(serverDb, 'sosRequests', id), {
        status: 'ASSIGNED',
        responderId: responder.id,
        responderName: responder.name,
        responderPhone: responder.phone,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // ignore
    }

    return sos;
  },

  // CAMPUS LOCATIONS
  async getActiveLocations() {
    return memoryStore.locations.filter((l) => l.isActive);
  },

  async getAllLocations() {
    return memoryStore.locations;
  },

  async getNearbyLocations(lat: number, lon: number, maxDistanceMeters: number = 3000) {
    const locations = memoryStore.locations.filter((l) => l.isActive);
    return locations
      .map((loc) => {
        const [lLng, lLat] = loc.location.coordinates;
        const distanceMeters = calculateDistanceMeters(lat, lon, lLat, lLng);
        return {
          ...loc,
          distanceMeters,
        };
      })
      .filter((loc) => loc.distanceMeters <= maxDistanceMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  },

  async createLocation(data: any) {
    const id = data._id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newLoc = {
      _id: id,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...data,
    };
    memoryStore.locations.push(newLoc);

    try {
      await setDoc(doc(serverDb, 'locations', id), newLoc);
    } catch (err) {
      // ignore
    }

    return newLoc;
  },

  async updateLocation(id: string, data: any) {
    const idx = memoryStore.locations.findIndex((l) => String(l._id) === String(id));
    if (idx !== -1) {
      memoryStore.locations[idx] = { ...memoryStore.locations[idx], ...data, updatedAt: new Date().toISOString() };
      try {
        await updateDoc(doc(serverDb, 'locations', id), data);
      } catch (err) {
        // ignore
      }
      return memoryStore.locations[idx];
    }
    return null;
  },

  async deleteLocation(id: string) {
    const idx = memoryStore.locations.findIndex((l) => String(l._id) === String(id));
    if (idx !== -1) {
      const removed = memoryStore.locations.splice(idx, 1)[0];
      try {
        await deleteDoc(doc(serverDb, 'locations', id));
      } catch (err) {
        // ignore
      }
      return removed;
    }
    return null;
  },

  // INCIDENT METHODS
  async createIncident(data: any) {
    const id = data._id || `inc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newInc = {
      _id: id,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    memoryStore.incidents.unshift(newInc);

    try {
      await setDoc(doc(serverDb, 'incidents', id), newInc);
    } catch (err) {
      // ignore
    }

    return newInc;
  },

  async getAllIncidents() {
    return memoryStore.incidents;
  },

  async getIncidentsByUserId(userId: string) {
    return memoryStore.incidents.filter((i) => i.userId === userId);
  },

  async findIncidentById(id: string) {
    return memoryStore.incidents.find((i) => String(i._id) === String(id)) || null;
  },

  async getIncidentsForUser(userId: string) {
    return this.getIncidentsByUserId(userId);
  },

  async getIncidentById(id: string) {
    return this.findIncidentById(id);
  },

  async updateIncidentStatus(id: string, status: IncidentStatus, resolutionNotes?: string) {
    const inc = memoryStore.incidents.find((i) => String(i._id) === String(id));
    if (!inc) return null;

    inc.status = status;
    inc.updatedAt = new Date().toISOString();
    if (resolutionNotes) inc.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED') inc.resolvedAt = new Date().toISOString();

    try {
      await updateDoc(doc(serverDb, 'incidents', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // ignore
    }

    return inc;
  },

  // SYSTEM SETTINGS
  async getSettings() {
    return memoryStore.settings;
  },

  async updateSettings(data: any) {
    memoryStore.settings = { ...memoryStore.settings, ...data, updatedAt: new Date().toISOString() };
    try {
      await updateDoc(doc(serverDb, 'settings', 'campus_config'), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // ignore
    }
    return memoryStore.settings;
  },

  async logRegistrationAttempt(email: string, status: 'SUCCESS' | 'FAILED', reason?: string) {
    if (memoryStore.settings) {
      if (!memoryStore.settings.registrationAttempts) {
        memoryStore.settings.registrationAttempts = [];
      }
      memoryStore.settings.registrationAttempts.unshift({
        email,
        attemptedAt: new Date().toISOString(),
        status,
        reason,
      });
      if (memoryStore.settings.registrationAttempts.length > 50) {
        memoryStore.settings.registrationAttempts = memoryStore.settings.registrationAttempts.slice(0, 50);
      }
    }
  },

  // AUDIT LOGS
  async addAuditLog(action: string, performedBy: { id: string; name: string; role: string }, target?: string, details?: any, ipAddress?: string) {
    const log = {
      _id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      performedBy,
      target: target || '',
      details: details || {},
      ipAddress: ipAddress || '',
      createdAt: new Date().toISOString(),
    };
    memoryStore.auditLogs.unshift(log);

    try {
      await setDoc(doc(serverDb, 'auditLogs', log._id), log);
    } catch (err) {
      // ignore
    }

    return log;
  },

  async getAuditLogs(limitCount: number = 20) {
    return memoryStore.auditLogs.slice(0, limitCount);
  },
};
