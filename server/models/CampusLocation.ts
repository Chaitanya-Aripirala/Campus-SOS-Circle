export interface ICampusLocation {
  _id?: string;
  name: string;
  type: 'Library' | 'Medical' | 'Security' | 'Hostel' | 'Canteen' | 'Lab' | 'Gate' | 'AED' | 'Washroom' | 'Sports' | 'Admin' | 'Other';
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  building?: string;
  floor?: string;
  room?: string;
  image?: string;
  contact?: string;
  hours?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
