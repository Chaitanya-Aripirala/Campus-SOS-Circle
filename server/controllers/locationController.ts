import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DataStore } from '../services/store';

export async function getLocations(req: Request, res: Response) {
  try {
    const locations = await DataStore.getAllLocations();
    return res.json({ success: true, count: locations.length, locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch campus locations' });
  }
}

export async function getNearbyLocations(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string) || 17.4206;
    const lng = parseFloat(req.query.lng as string) || 78.6558;
    const maxDist = parseInt(req.query.maxDistance as string) || 5000;

    const nearby = await DataStore.getNearbyLocations(lat, lng, maxDist);
    return res.json({
      success: true,
      currentLocation: { lat, lng },
      count: nearby.length,
      nearbyLocations: nearby,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate nearby campus facilities' });
  }
}

export async function createLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, type, description, latitude, longitude, building, floor, room, image, contact, hours } = req.body;

    if (!name || !type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Name, type, latitude, and longitude are required' });
    }

    const newLoc = await DataStore.createLocation({
      name: name.trim(),
      type,
      description: description || '',
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      },
      building: building || '',
      floor: floor || '',
      room: room || '',
      image: image || '',
      contact: contact || '',
      hours: hours || '8:00 AM - 8:00 PM',
    });

    if (req.user) {
      await DataStore.addAuditLog('CAMPUS_LOCATION_CREATED', { id: req.user.id, name: req.user.name, role: req.user.role }, name);
    }

    return res.status(201).json({ success: true, message: 'Campus location added successfully!', location: newLoc });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create campus location' });
  }
}

export async function updateLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, type, description, latitude, longitude, building, floor, room, image, contact, hours, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }
    if (building !== undefined) updateData.building = building;
    if (floor !== undefined) updateData.floor = floor;
    if (room !== undefined) updateData.room = room;
    if (image !== undefined) updateData.image = image;
    if (contact !== undefined) updateData.contact = contact;
    if (hours !== undefined) updateData.hours = hours;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await DataStore.updateLocation(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (req.user) {
      await DataStore.addAuditLog('CAMPUS_LOCATION_UPDATED', { id: req.user.id, name: req.user.name, role: req.user.role }, id);
    }

    return res.json({ success: true, message: 'Location updated successfully', location: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update location' });
  }
}

export async function deleteLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deleted = await DataStore.deleteLocation(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (req.user) {
      await DataStore.addAuditLog('CAMPUS_LOCATION_DELETED', { id: req.user.id, name: req.user.name, role: req.user.role }, id);
    }

    return res.json({ success: true, message: 'Campus location deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete location' });
  }
}
