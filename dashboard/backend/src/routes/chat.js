import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { processChat, getChatHistory, clearChatHistory } from '../services/chatService.js';

const router = Router();
router.use(authMiddleware);

// ── POST /api/chat ──────────────────────────────────────────
router.post('/', async (req, res, next) => {
    try {
        const body = req.body || {};
        const message = body.message;
        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const result = await processChat(req.user.id, message.trim());
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/chat/history ───────────────────────────────────
router.get('/history', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const messages = await getChatHistory(req.user.id, limit);
        res.json({ messages });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/chat/history ────────────────────────────────
router.delete('/history', async (req, res, next) => {
    try {
        await clearChatHistory(req.user.id);
        res.json({ cleared: true });
    } catch (err) {
        next(err);
    }
});

export default router;
