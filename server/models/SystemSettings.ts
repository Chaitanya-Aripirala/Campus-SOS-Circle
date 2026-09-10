export interface IEmergencyContact {
  id: string;
  title: string;
  phone: string;
  description: string;
  category: 'Security' | 'Medical' | 'Helpline' | 'Police' | 'Fire' | 'Administration';
  is24x7: boolean;
}

export interface IRegistrationAttempt {
  email: string;
  attemptedAt: Date | string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}

export interface ISystemSettings {
  _id?: string;
  collegeName: string;
  studentEmailDomain: string; // e.g. "anurag.edu.in"
  studentEmailPattern: string; // e.g. "{rollNumber}@anurag.edu.in"
  studentEmailRegex: string; // e.g. "^[0-9]{2}[a-zA-Z]{2}[0-9]{3}[a-zA-Z0-9]{3}@anurag\\.edu\\.in$"
  allowSelfRegistration: boolean;
  sosCategories: string[];
  emergencyContacts: IEmergencyContact[];
  registrationAttempts?: IRegistrationAttempt[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
