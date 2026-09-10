import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { connectFirebase } from './server/config/firebase';
import { seedInitialData } from './server/services/store';
import { initializeSocketIO } from './server/sockets/socketHandler';
import apiRouter from './server/routes/api';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Security & Parsing Middlewares
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
  });
  initializeSocketIO(io);

  // Initialize Cloud Firestore and seed data
  await connectFirebase();
  await seedInitialData();

  // Mount API Routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Campus SOS Circle] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Campus SOS Circle] Real-time Socket.IO and Gemini AI active.`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]', err);
});
