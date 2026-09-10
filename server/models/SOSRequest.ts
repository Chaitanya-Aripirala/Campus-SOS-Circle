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

export interface ISOSStatusHistory {
  status: SOSStatus;
  timestamp: Date | string;
  note?: string;
  updatedBy?: string;
}

export interface ISOSRequest {
  _id?: string;
  userId: string;
  userName: string;
  userRollNumber?: string;
  userPhone?: string;
  userEmail?: string;
  type: SOSType;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
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
  statusHistory?: ISOSStatusHistory[];
  evidenceImage?: string;
  createdAt?: Date | string;
  acknowledgedAt?: Date | string;
  assignedAt?: Date | string;
  resolvedAt?: Date | string;
  resolutionNotes?: string;
}
