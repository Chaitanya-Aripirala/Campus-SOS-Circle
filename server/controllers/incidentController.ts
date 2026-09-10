import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DataStore } from '../services/store';
import { classifyIncidentAI } from '../services/aiService';
import { broadcastNewIncident } from '../sockets/socketHandler';

export async function createIncident(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

    const { title, description, category, locationName, latitude, longitude, imageUrl, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    // Run AI classification to assist security triage
    const aiAnalysis = await classifyIncidentAI(description, category);

    const lat = Number(latitude) || 17.4206;
    const lng = Number(longitude) || 78.6558;

    const incident = await DataStore.createIncident({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      category: category || aiAnalysis.category || 'Security',
      title: title.trim(),
      description: description.trim(),
      locationName: locationName || 'Campus Zone',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      imageUrl: imageUrl || '',
      priority: priority || (aiAnalysis.severity === 'Critical' ? 'Urgent' : aiAnalysis.severity) || 'Medium',
      status: 'SUBMITTED',
      aiAnalysis,
    });

    broadcastNewIncident(incident);

    await DataStore.addAuditLog('INCIDENT_REPORTED', { id: req.user.id, name: req.user.name, role: req.user.role }, title);

    return res.status(201).json({
      success: true,
      message: 'Incident report submitted successfully. Campus security will review the details.',
      incident,
    });
  } catch (error) {
    console.error('[Incident] Create error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit incident report' });
  }
}

export async function getIncidents(req: AuthenticatedRequest, res: Response) {
  try {
    let all = await DataStore.getAllIncidents();
    const { category, status, priority } = req.query;

    if (category) {
      all = all.filter((i) => i.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (status) {
      all = all.filter((i) => i.status.toLowerCase() === (status as string).toLowerCase());
    }
    if (priority) {
      all = all.filter((i) => i.priority.toLowerCase() === (priority as string).toLowerCase());
    }

    return res.json({ success: true, count: all.length, incidents: all });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getMyIncidents(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const list = await DataStore.getIncidentsForUser(req.user.id);
    return res.json({ success: true, count: list.length, incidents: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getIncidentById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const inc = await DataStore.getIncidentById(id);
    if (!inc) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    return res.json({ success: true, incident: inc });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateIncidentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await DataStore.updateIncidentStatus(id, status, notes);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    await DataStore.addAuditLog(
      `INCIDENT_${status}`,
      { id: req.user.id, name: req.user.name, role: req.user.role },
      id,
      { notes }
    );

    return res.json({ success: true, message: `Incident marked as ${status}`, incident: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update incident' });
  }
}
