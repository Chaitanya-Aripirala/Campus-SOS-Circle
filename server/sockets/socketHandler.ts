import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_sos_circle_super_secure_jwt_token_secret_key_2026';

let ioInstance: SocketIOServer | null = null;

export function initializeSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Authenticate socket via handshake query or auth token
    const token = socket.handshake.auth?.token || (socket.handshake.query?.token as string);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        socket.data.user = decoded;
        
        // Join personal user room
        socket.join(`user:${decoded.id}`);
        // Join role-specific broadcast room
        socket.join(`role:${decoded.role}`);

        console.log(`[Socket] User connected: ${decoded.name} (${decoded.role}) -> socket ID: ${socket.id}`);
      } catch (e) {
        console.log(`[Socket] Anonymous client connected -> socket ID: ${socket.id}`);
      }
    } else {
      console.log(`[Socket] Public/guest client connected -> socket ID: ${socket.id}`);
    }

    // Join specific SOS room for real-time tracking
    socket.on('sos:join_room', (sosId: string) => {
      socket.join(`sos:${sosId}`);
    });

    socket.on('sos:leave_room', (sosId: string) => {
      socket.leave(`sos:${sosId}`);
    });

    // Responder live location streaming
    socket.on('responder:send_location', (payload: { sosId: string; lat: number; lng: number; responderName: string }) => {
      io.to(`sos:${payload.sosId}`).emit('responder:location_updated', payload);
      io.to('role:Security').emit('responder:location_updated', payload);
      io.to('role:Admin').emit('responder:location_updated', payload);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

// Broadcast helpers
export function broadcastNewSOS(sosData: any) {
  if (!ioInstance) return;
  // Notify responders, security, and admins immediately
  ioInstance.to('role:Responder').emit('sos:created', sosData);
  ioInstance.to('role:Security').emit('sos:created', sosData);
  ioInstance.to('role:Admin').emit('sos:created', sosData);
  ioInstance.emit('global:emergency_alert', {
    type: sosData.type,
    severity: sosData.severity,
    locationName: sosData.location?.addressName || 'Campus Zone',
    timestamp: new Date(),
  });
}

export function broadcastSOSStatusUpdate(sosData: any, newStatus: string, note?: string) {
  if (!ioInstance) return;
  // Send to student's room
  ioInstance.to(`user:${sosData.userId}`).emit('sos:status_changed', {
    sosId: sosData._id,
    sos: sosData,
    newStatus,
    note,
  });

  // Send to tracking room
  ioInstance.to(`sos:${sosData._id}`).emit('sos:status_changed', {
    sosId: sosData._id,
    sos: sosData,
    newStatus,
    note,
  });

  // Notify security, responders, and admin
  ioInstance.to('role:Security').emit('sos:updated', sosData);
  ioInstance.to('role:Admin').emit('sos:updated', sosData);
  ioInstance.to('role:Responder').emit('sos:updated', sosData);
}

export function broadcastNewIncident(incidentData: any) {
  if (!ioInstance) return;
  ioInstance.to('role:Security').emit('incident:created', incidentData);
  ioInstance.to('role:Admin').emit('incident:created', incidentData);
}
