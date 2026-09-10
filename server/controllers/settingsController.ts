import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DataStore } from '../services/store';

export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await DataStore.getSettings();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const { collegeName, studentEmailDomain, studentEmailPattern, studentEmailRegex, allowSelfRegistration, emergencyContacts } = req.body;

    const updateData: any = {};
    if (collegeName !== undefined) updateData.collegeName = collegeName.trim();
    if (studentEmailDomain !== undefined) updateData.studentEmailDomain = studentEmailDomain.trim().toLowerCase();
    if (studentEmailPattern !== undefined) updateData.studentEmailPattern = studentEmailPattern.trim();
    if (studentEmailRegex !== undefined) updateData.studentEmailRegex = studentEmailRegex.trim();
    if (allowSelfRegistration !== undefined) updateData.allowSelfRegistration = Boolean(allowSelfRegistration);
    if (emergencyContacts !== undefined && Array.isArray(emergencyContacts)) updateData.emergencyContacts = emergencyContacts;

    const updated = await DataStore.updateSettings(updateData);

    if (req.user) {
      await DataStore.addAuditLog('SYSTEM_SETTINGS_UPDATED', { id: req.user.id, name: req.user.name, role: req.user.role }, 'Settings', updateData);
    }

    return res.json({ success: true, message: 'Campus safety settings updated successfully!', settings: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
}

export async function getRegistrationAttempts(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await DataStore.getSettings();
    return res.json({
      success: true,
      attempts: settings?.registrationAttempts || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch registration logs' });
  }
}
