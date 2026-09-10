import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { DataStore } from '../services/store';

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await DataStore.getAllUsers();
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role, rollNumber, department, year, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await DataStore.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await DataStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      rollNumber: rollNumber || '',
      department: department || '',
      year: year || '',
      phone: phone || '',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    });

    if (req.user) {
      await DataStore.addAuditLog('USER_CREATED_BY_ADMIN', { id: req.user.id, name: req.user.name, role: req.user.role }, cleanEmail, { role });
    }

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ success: true, message: `Created new ${role} user successfully`, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
}

export async function updateAvailability(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { isAvailable } = req.body;

    const updated = await DataStore.updateUser(req.user.id, { isAvailable: Boolean(isAvailable) });
    return res.json({ success: true, message: `Status updated to ${isAvailable ? 'Available' : 'Busy/Offline'}`, user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
}

export async function updateLocation(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const updated = await DataStore.updateUser(req.user.id, {
      currentLocation: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    return res.json({ success: true, location: { latitude, longitude } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update location' });
  }
}
