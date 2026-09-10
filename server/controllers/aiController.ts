import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { chatWithCircleAI, classifyIncidentAI, summarizeIncidentAI, generateCampusSafetyInsights } from '../services/aiService';
import { DataStore } from '../services/store';

export async function chat(req: AuthenticatedRequest, res: Response) {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const userContext = {
      name: req.user?.name || context?.name || 'Campus Student',
      role: req.user?.role || context?.role || 'Student',
      lat: context?.lat || 17.4206,
      lng: context?.lng || 78.6558,
      activeSOS: context?.activeSOS || false,
    };

    const aiResponse = await chatWithCircleAI(messages, userContext);
    return res.json({ success: true, ...aiResponse });
  } catch (error) {
    console.error('[AI] Chat controller error:', error);
    return res.status(500).json({
      success: false,
      reply: 'Circle AI is currently re-establishing campus network link. Please use emergency helplines if urgent.',
    });
  }
}

export async function classify(req: Request, res: Response) {
  try {
    const { description, categorySuggestion } = req.body;
    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const classification = await classifyIncidentAI(description, categorySuggestion);
    return res.json({ success: true, classification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Classification failed' });
  }
}

export async function summarize(req: Request, res: Response) {
  try {
    const { reportText } = req.body;
    if (!reportText) {
      return res.status(400).json({ success: false, message: 'Report text is required' });
    }

    const summary = await summarizeIncidentAI(reportText);
    return res.json({ success: true, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Summarization failed' });
  }
}

export async function getInsights(req: AuthenticatedRequest, res: Response) {
  try {
    const incidents = await DataStore.getAllIncidents();
    const sosRecords = await DataStore.getAllSOS();

    const insights = await generateCampusSafetyInsights(incidents, sosRecords);
    return res.json({ success: true, insights });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate insights' });
  }
}
