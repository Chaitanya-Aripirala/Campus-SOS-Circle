export interface IAuditLog {
  _id?: string;
  action: string;
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  target?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt?: Date | string;
}
