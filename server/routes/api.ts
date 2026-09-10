import express, { Router } from 'express';
import multer from 'multer';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as sosController from '../controllers/sosController';
import * as locationController from '../controllers/locationController';
import * as incidentController from '../controllers/incidentController';
import * as aiController from '../controllers/aiController';
import * as settingsController from '../controllers/settingsController';
import * as usersController from '../controllers/usersController';
import * as analyticsController from '../controllers/analyticsController';
import * as uploadController from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Campus SOS Circle API',
    timestamp: new Date().toISOString(),
  });
});

// AUTH ROUTES
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// SOS ROUTES
router.post('/sos', authenticateToken, sosController.createSOS);
router.get('/sos/active', authenticateToken, sosController.getActiveSOS);
router.get('/sos/all', authenticateToken, requireRole('Security', 'Admin'), sosController.getAllSOS);
router.get('/sos/my', authenticateToken, sosController.getMySOS);
router.get('/sos/:id', authenticateToken, sosController.getSOSById);
router.post('/sos/:id/accept', authenticateToken, requireRole('Responder', 'Security', 'Admin'), sosController.acceptSOS);
router.patch('/sos/:id/status', authenticateToken, sosController.updateSOSStatus);

// CAMPUS LOCATIONS ROUTES
router.get('/locations', locationController.getLocations);
router.get('/locations/nearby', locationController.getNearbyLocations);
router.post('/locations', authenticateToken, requireRole('Admin'), locationController.createLocation);
router.patch('/locations/:id', authenticateToken, requireRole('Admin'), locationController.updateLocation);
router.delete('/locations/:id', authenticateToken, requireRole('Admin'), locationController.deleteLocation);

// INCIDENT REPORTING ROUTES
router.post('/incidents', authenticateToken, incidentController.createIncident);
router.get('/incidents', authenticateToken, incidentController.getIncidents);
router.get('/incidents/my', authenticateToken, incidentController.getMyIncidents);
router.get('/incidents/:id', authenticateToken, incidentController.getIncidentById);
router.patch('/incidents/:id/status', authenticateToken, requireRole('Security', 'Admin'), incidentController.updateIncidentStatus);

// GEMINI AI ROUTES
router.post('/ai/chat', optionalAuthenticateToken, aiController.chat);
router.post('/ai/classify', authenticateToken, aiController.classify);
router.post('/ai/summarize', authenticateToken, requireRole('Security', 'Admin'), aiController.summarize);
router.get('/ai/insights', authenticateToken, requireRole('Security', 'Admin'), aiController.getInsights);

// SYSTEM SETTINGS & EMAIL CONFIGURATION ROUTES
router.get('/settings', settingsController.getSettings);
router.patch('/settings', authenticateToken, requireRole('Admin'), settingsController.updateSettings);
router.get('/settings/attempts', authenticateToken, requireRole('Admin'), settingsController.getRegistrationAttempts);

// USER MANAGEMENT & PROFILE ROUTES
router.get('/users', authenticateToken, requireRole('Admin'), usersController.getAllUsers);
router.post('/users', authenticateToken, requireRole('Admin'), usersController.createUser);
router.patch('/users/availability', authenticateToken, usersController.updateAvailability);
router.patch('/users/location', authenticateToken, usersController.updateLocation);

// ANALYTICS ROUTES
router.get('/analytics/dashboard', authenticateToken, requireRole('Security', 'Admin'), analyticsController.getDashboardAnalytics);

// FILE UPLOAD ROUTES
router.post('/upload', authenticateToken, upload.single('image'), uploadController.uploadImage);

export default router;
