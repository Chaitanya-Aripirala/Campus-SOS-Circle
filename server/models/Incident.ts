export type IncidentCategory =
  | 'Security'
  | 'Infrastructure'
  | 'Harassment'
  | 'Cleanliness'
  | 'Medical'
  | 'Lost & Found'
  | 'Other';

export type IncidentStatus = 'SUBMITTED' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface IIncident {
  _id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: IncidentCategory;
  title: string;
  description: string;
  locationName: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
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
  resolvedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
