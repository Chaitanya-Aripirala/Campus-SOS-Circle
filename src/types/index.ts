export type Role = 'Student' | 'Responder' | 'Security' | 'Admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  rollNumber?: string;
  department?: string;
  year?: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  isAvailable?: boolean;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  createdAt?: string;
  updatedAt?: string;
}

export type SOSType = 'Medical' | 'Security' | 'Accident' | 'Fire' | 'Harassment' | 'Lost Person' | 'Other';
export type SOSSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type SOSStatus =
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'RESPONDER_ON_THE_WAY'
  | 'ARRIVED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface SOSStatusHistory {
  status: SOSStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface SOSRequest {
  _id: string;
  userId: string;
  userName: string;
  userRollNumber?: string;
  userPhone?: string;
  userEmail?: string;
  type: SOSType;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    addressName?: string;
  };
  severity: SOSSeverity;
  status: SOSStatus;
  assignedResponder?: {
    id: string;
    name: string;
    phone: string;
    role: string;
    distanceMeters?: number;
  };
  statusHistory: SOSStatusHistory[];
  evidenceImage?: string;
  createdAt: string;
  acknowledgedAt?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export type IncidentCategory =
  | 'Security'
  | 'Infrastructure'
  | 'Harassment'
  | 'Cleanliness'
  | 'Medical'
  | 'Lost & Found'
  | 'Other';

export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type IncidentStatus = 'SUBMITTED' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface Incident {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: IncidentCategory;
  title: string;
  description: string;
  locationName: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  imageUrl?: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  aiAnalysis?: {
    category?: string;
    severity?: string;
    summary?: string;
    recommendedHandling?: string;
  };
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LocationType =
  | 'Library'
  | 'Medical'
  | 'Security'
  | 'Hostel'
  | 'Canteen'
  | 'Lab'
  | 'Gate'
  | 'AED'
  | 'Washroom'
  | 'Sports'
  | 'Admin'
  | 'Other';

export interface CampusLocation {
  _id: string;
  name: string;
  type: LocationType;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  building?: string;
  floor?: string;
  room?: string;
  image?: string;
  contact?: string;
  hours?: string;
  isActive: boolean;
  distanceMeters?: number;
  distanceFormatted?: string;
  createdAt?: string;
}

export interface EmergencyContact {
  id: string;
  title: string;
  phone: string;
  description: string;
  category: 'Security' | 'Medical' | 'Helpline' | 'Police' | 'Fire' | 'Administration';
  is24x7: boolean;
}

export interface RegistrationAttempt {
  email: string;
  attemptedAt: string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}

export interface SystemSettings {
  _id?: string;
  collegeName: string;
  studentEmailDomain: string;
  studentEmailPattern: string;
  studentEmailRegex: string;
  allowSelfRegistration: boolean;
  sosCategories: string[];
  emergencyContacts: EmergencyContact[];
  registrationAttempts: RegistrationAttempt[];
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  availableResponders: number;
  activeSOS: number;
  resolvedSOS: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResponseTime: string;
}
