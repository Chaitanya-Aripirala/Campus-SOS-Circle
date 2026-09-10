import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
  CampusLocation,
  SOSRequest,
  SOSStatus,
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
  SystemSettings,
  EmergencyContact,
} from '../types';

// ==========================================
// 1. CAMPUS LOCATIONS (FIRESTORE)
// ==========================================
const DEFAULT_LOCATIONS: CampusLocation[] = [
  {
    _id: 'loc_medical_01',
    name: '24/7 Campus Medical Center & Ward',
    type: 'Medical',
    location: { type: 'Point', coordinates: [78.6565, 17.4208] },
    description: 'Round-the-clock emergency medical ward with triage bay, ambulance bay, and basic life support (BLS).',
    building: 'Health & Wellness Block',
    floor: 'Ground Floor',
    room: 'Triage Room 01',
    contact: '+91-8415-255108',
    hours: '24 Hours Open',
    isActive: true,
  },
  {
    _id: 'loc_security_01',
    name: 'Central Campus Security & CCTV Control',
    type: 'Security',
    location: { type: 'Point', coordinates: [78.6552, 17.4204] },
    description: 'Main campus security command center, quick-response dispatch base, and surveillance monitor room.',
    building: 'Main Entrance Archway',
    floor: 'Ground Floor',
    room: 'Security HQ',
    contact: '+91-8415-255555',
    hours: '24 Hours Open',
    isActive: true,
  },
  {
    _id: 'loc_gate1_01',
    name: 'Main Emergency Entrance & Gate 1',
    type: 'Gate',
    location: { type: 'Point', coordinates: [78.6548, 17.4195] },
    description: 'Primary vehicular entry and dedicated emergency medical vehicle clearance point.',
    building: 'Campus Perimeter',
    floor: 'Ground',
    room: 'Gate Guard House',
    contact: '+91-8415-255001',
    hours: '24 Hours Open',
    isActive: true,
  },
  {
    _id: 'loc_aed_01',
    name: 'Automated External Defibrillator (AED) - Block A',
    type: 'AED',
    location: { type: 'Point', coordinates: [78.6559, 17.4212] },
    description: 'Public-access cardiac defibrillator station with audio-guided CPR assistance instructions.',
    building: 'Engineering Block A',
    floor: '1st Floor Atrium',
    room: 'Emergency Pillar 02',
    contact: '+91-8415-255108',
    hours: 'Always Accessible',
    isActive: true,
  },
  {
    _id: 'loc_lib_01',
    name: 'Central Library Safe Zone & First Aid Desk',
    type: 'Library',
    location: { type: 'Point', coordinates: [78.6575, 17.4212] },
    description: 'Monitored quiet refuge zone equipped with trauma kit, automated defibrillator (AED), and emergency phone.',
    building: 'Knowledge Center',
    floor: '1st Floor Atrium',
    room: 'Circulation Desk',
    contact: '+91-8415-255222',
    hours: '8:00 AM - 10:00 PM',
    isActive: true,
  },
  {
    _id: 'loc_sports_01',
    name: 'Sports Complex First Response Post',
    type: 'Sports',
    location: { type: 'Point', coordinates: [78.6562, 17.4207] },
    description: 'Sports field first aid post, stretcher supply, ice packs, and trauma kit.',
    building: 'Sports Complex',
    floor: 'Ground',
    room: 'First Aid Room',
    contact: '+91-8415-255301',
    hours: '6:00 AM - 8:00 PM',
    isActive: true,
  },
];

export async function fetchLocationsFromFirestore(): Promise<CampusLocation[]> {
  try {
    const coll = collection(db, 'locations');
    const snap = await getDocs(coll);

    if (snap.empty) {
      for (const loc of DEFAULT_LOCATIONS) {
        await setDoc(doc(db, 'locations', loc._id), {
          ...loc,
          createdAt: serverTimestamp(),
        });
      }
      return DEFAULT_LOCATIONS;
    }

    const items: CampusLocation[] = [];
    snap.forEach((d) => {
      const data = d.data();
      items.push({
        _id: d.id,
        name: data.name,
        type: data.type || 'Other',
        location: data.location || { type: 'Point', coordinates: [78.6558, 17.4206] },
        description: data.description || '',
        building: data.building,
        floor: data.floor,
        room: data.room,
        contact: data.contact,
        hours: data.hours,
        isActive: data.isActive !== false,
      });
    });
    return items;
  } catch (err) {
    console.warn('[Firestore] Error fetching locations:', err);
    return DEFAULT_LOCATIONS;
  }
}

// ==========================================
// 2. SOS DISTRESS REQUESTS (FIRESTORE)
// ==========================================
export async function createSOSInFirestore(data: {
  userId: string;
  userName: string;
  userEmail: string;
  userRollNumber?: string;
  userPhone?: string;
  type: string;
  severity: string;
  description?: string;
  latitude: number;
  longitude: number;
  addressName?: string;
  evidenceImage?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = doc(collection(db, 'sosRequests'));
    const initialStatus: SOSStatus = 'PENDING';
    const sosPayload = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      userRollNumber: data.userRollNumber || '',
      userPhone: data.userPhone || '',
      type: data.type,
      severity: data.severity,
      description: data.description || '',
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude] as [number, number],
        addressName: data.addressName || 'Anurag University Campus',
      },
      evidenceImage: data.evidenceImage || '',
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: new Date().toISOString(),
          note: 'Distress alert broadcasted to Campus Safety Circle',
        },
      ],
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, sosPayload);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('[Firestore] Create SOS failed:', error);
    return { success: false, error: error?.message || 'Failed to dispatch SOS alert' };
  }
}

export function subscribeToActiveSOS(callback: (sosList: SOSRequest[]) => void) {
  const q = query(collection(db, 'sosRequests'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: SOSRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          _id: d.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone,
          userRollNumber: data.userRollNumber,
          type: data.type,
          severity: data.severity,
          status: data.status,
          description: data.description,
          location: data.location || {
            type: 'Point',
            coordinates: [78.6558, 17.4206],
            addressName: 'Campus',
          },
          statusHistory: data.statusHistory || [],
          evidenceImage: data.evidenceImage,
          assignedResponder: data.assignedResponder,
          createdAt: data.createdAt || new Date().toISOString(),
          acknowledgedAt: data.acknowledgedAt,
          assignedAt: data.assignedAt,
          resolvedAt: data.resolvedAt,
          resolutionNotes: data.resolutionNotes,
        });
      });
      callback(list);
    },
    (err) => {
      console.warn('[Firestore] SOS subscription notice:', err.message);
    }
  );
}

export async function updateSOSStatusInFirestore(
  sosId: string,
  status: SOSStatus,
  note?: string,
  responderInfo?: { id: string; name: string; phone: string; role: string }
): Promise<boolean> {
  try {
    const docRef = doc(db, 'sosRequests', sosId);
    const updatePayload: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (note) updatePayload.resolutionNotes = note;
    if (responderInfo) {
      updatePayload.assignedResponder = responderInfo;
      updatePayload.assignedAt = new Date().toISOString();
    }
    if (status === 'ACKNOWLEDGED') {
      updatePayload.acknowledgedAt = new Date().toISOString();
    }
    if (status === 'RESOLVED') {
      updatePayload.resolvedAt = new Date().toISOString();
    }
    await updateDoc(docRef, updatePayload);
    return true;
  } catch (err) {
    console.error('[Firestore] Update SOS status failed:', err);
    return false;
  }
}

// ==========================================
// 3. INCIDENTS (FIRESTORE)
// ==========================================
export async function createIncidentInFirestore(incidentData: {
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  userId: string;
  userName: string;
  userEmail: string;
  locationName: string;
  location: { type: 'Point'; coordinates: [number, number] };
  imageUrl?: string;
  aiAnalysis?: any;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const docRef = doc(collection(db, 'incidents'));
    const initialStatus: IncidentStatus = 'SUBMITTED';
    await setDoc(docRef, {
      ...incidentData,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('[Firestore] Create Incident failed:', error);
    return { success: false, error: error?.message || 'Failed to submit incident' };
  }
}

export function subscribeToIncidents(callback: (incidents: Incident[]) => void) {
  const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Incident[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          _id: d.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          title: data.title,
          description: data.description,
          category: data.category as IncidentCategory,
          priority: data.priority as IncidentPriority,
          status: data.status as IncidentStatus,
          locationName: data.locationName || 'Campus Ground',
          location: data.location || { type: 'Point', coordinates: [78.6558, 17.4206] },
          imageUrl: data.imageUrl,
          aiAnalysis: data.aiAnalysis,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
          resolutionNotes: data.resolutionNotes,
          resolvedAt: data.resolvedAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.warn('[Firestore] Incidents subscription notice:', err.message);
    }
  );
}

// ==========================================
// 4. SYSTEM SETTINGS & EMERGENCY CONTACTS
// ==========================================
const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'ec_1',
    title: 'Campus Security Central Control (24/7)',
    phone: '+91-8415-255555',
    description: 'Immediate on-campus guard dispatch and surveillance coordination',
    category: 'Security',
    is24x7: true,
  },
  {
    id: 'ec_2',
    title: 'Campus Medical Centre & Ambulance Desk',
    phone: '+91-8415-255108',
    description: 'Campus emergency doctors, triage bay, and ambulance dispatch',
    category: 'Medical',
    is24x7: true,
  },
  {
    id: 'ec_3',
    title: 'Women Student Safety & Antiragging Committee',
    phone: '+91-8415-255999',
    description: 'Confidential women safety, anti-harassment, and student counsel',
    category: 'Helpline',
    is24x7: true,
  },
  {
    id: 'ec_4',
    title: 'Ghatkesar Police Station (Local Jurisdictional)',
    phone: '+91-8415-222100',
    description: 'Local police station assistance and law enforcement',
    category: 'Police',
    is24x7: true,
  },
  {
    id: 'ec_5',
    title: 'Telangana State National Emergency Service',
    phone: '112',
    description: 'All-India emergency response support system',
    category: 'Police',
    is24x7: true,
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  _id: 'settings_default',
  collegeName: 'Anurag University Campus Safety Directorate',
  studentEmailDomain: 'anurag.edu.in',
  studentEmailPattern: '{rollNumber}@anurag.edu.in',
  studentEmailRegex: '^[0-9]{2}[a-zA-Z0-9]{8}@anurag\\.edu\\.in$',
  allowSelfRegistration: true,
  sosCategories: ['Medical', 'Security', 'Accident', 'Fire', 'Harassment', 'Lost Person', 'Other'],
  emergencyContacts: DEFAULT_CONTACTS,
  registrationAttempts: [],
  updatedAt: new Date().toISOString(),
};

export async function fetchSettingsFromFirestore(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, 'settings', 'campus_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { _id: snap.id, ...(snap.data() as any) };
    }
    await setDoc(docRef, { ...DEFAULT_SETTINGS, updatedAt: serverTimestamp() });
    return DEFAULT_SETTINGS;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}
