import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DataStore, calculateDistanceMeters } from '../services/store';
import { broadcastNewSOS, broadcastSOSStatusUpdate } from '../sockets/socketHandler';
import { SOSStatus } from '../models/SOSRequest';

export async function createSOS(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { type, description, latitude, longitude, addressName, severity, evidenceImage } = req.body;

    const lat = Number(latitude) || 17.4206;
    const lng = Number(longitude) || 78.6558;

    // Smart Responder Recommendation:
    // Find eligible responders who are active and available, ranked by proximity
    const responders = await DataStore.getAvailableResponders();
    const rankedResponders = responders.map((r: any) => {
      const [rLng, rLat] = r.currentLocation?.coordinates || [78.6558, 17.4206];
      const dist = calculateDistanceMeters(lat, lng, rLat, rLng);
      return {
        id: String(r._id),
        name: r.name,
        role: r.role,
        phone: r.phone || '+91-8415-255555',
        distanceMeters: dist,
      };
    }).sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

    const nearestResponder = rankedResponders[0] || null;

    const sos = await DataStore.createSOS({
      userId: req.user.id,
      userName: req.user.name,
      userRollNumber: req.user.rollNumber || '',
      userPhone: req.user.phone || '',
      userEmail: req.user.email,
      type: type || 'Security',
      description: description || '',
      severity: severity || 'High',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        addressName: addressName || 'Campus Zone',
      },
      evidenceImage: evidenceImage || '',
    });

    // Broadcast instant Socket.IO alert
    broadcastNewSOS(sos);

    // Audit log
    await DataStore.addAuditLog(
      'SOS_TRIGGERED',
      { id: req.user.id, name: req.user.name, role: req.user.role },
      String(sos._id),
      { type: sos.type, severity: sos.severity, coords: [lat, lng] }
    );

    return res.status(201).json({
      success: true,
      message: '🚨 Emergency SOS broadcasted! Nearby responders and campus security have been notified.',
      sos,
      recommendedResponders: rankedResponders.slice(0, 3),
    });
  } catch (error) {
    console.error('[SOS] Create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to broadcast emergency SOS.' });
  }
}

export async function getActiveSOS(req: AuthenticatedRequest, res: Response) {
  try {
    const active = await DataStore.getActiveSOS();
    return res.json({ success: true, count: active.length, sosList: active });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getAllSOS(req: AuthenticatedRequest, res: Response) {
  try {
    const all = await DataStore.getAllSOS();
    return res.json({ success: true, count: all.length, sosList: all });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getSOSById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const sos = await DataStore.getSOSById(id);
    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS request not found' });
    }
    return res.json({ success: true, sos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getMySOS(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const list = await DataStore.getSOSForUser(req.user.id);
    return res.json({ success: true, sosList: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function acceptSOS(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { id } = req.params;

    const sos = await DataStore.getSOSById(id);
    if (!sos) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    if (sos.status === 'RESOLVED' || sos.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: `SOS is already ${sos.status.toLowerCase()}` });
    }

    // Calculate distance
    const [sosLng, sosLat] = sos.location.coordinates;
    const [myLng, myLat] = [78.6558, 17.4206]; // default or updated
    const dist = calculateDistanceMeters(sosLat, sosLng, myLat, myLng);

    const updatedSOS = await DataStore.assignResponderToSOS(id, {
      id: req.user.id,
      name: req.user.name,
      phone: req.user.phone || '+91-8415-255555',
      role: req.user.role,
      distanceMeters: dist,
      assignedBy: req.user.name,
    });

    // Advance to RESPONDER_ON_THE_WAY
    const finalSOS = await DataStore.updateSOSStatus(
      id,
      'RESPONDER_ON_THE_WAY',
      `${req.user.name} accepted the dispatch and is rushing to your location.`,
      req.user.name
    );

    broadcastSOSStatusUpdate(finalSOS, 'RESPONDER_ON_THE_WAY', `${req.user.name} is on the way.`);

    await DataStore.addAuditLog(
      'SOS_ACCEPTED',
      { id: req.user.id, name: req.user.name, role: req.user.role },
      id
    );

    return res.json({
      success: true,
      message: 'You have claimed this SOS response!',
      sos: finalSOS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to accept SOS' });
  }
}

export async function updateSOSStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses: SOSStatus[] = [
      'PENDING',
      'ACKNOWLEDGED',
      'ASSIGNED',
      'RESPONDER_ON_THE_WAY',
      'ARRIVED',
      'RESOLVED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid SOS status' });
    }

    const updated = await DataStore.updateSOSStatus(id, status, note, req.user.name);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'SOS not found' });
    }

    broadcastSOSStatusUpdate(updated, status, note);

    await DataStore.addAuditLog(
      `SOS_STATUS_${status}`,
      { id: req.user.id, name: req.user.name, role: req.user.role },
      id,
      { note }
    );

    return res.json({ success: true, message: `SOS status updated to ${status}`, sos: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
}
