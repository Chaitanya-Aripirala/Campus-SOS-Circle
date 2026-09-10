export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Student' | 'Responder' | 'Security' | 'Admin';
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
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
