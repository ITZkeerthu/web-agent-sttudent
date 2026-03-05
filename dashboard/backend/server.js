import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/auth.js';
import offerRoutes from './src/routes/offers.js';
import trackingRoutes from './src/routes/tracking.js';
import chatRoutes from './src/routes/chat.js';
import profileRoutes from './src/routes/profile.js';
import suggestionsRoutes from './src/routes/suggestions.js';
import statsRoutes from './src/routes/stats.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes (public) ────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/stats', statsRoutes);

// ── Routes (protected) ─────────────────────────────────────
app.use('/api/tracking', trackingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/suggestions', suggestionsRoutes);

// ── Error handler ──────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`SmartSaver backend running on http://localhost:${PORT}`);
});
