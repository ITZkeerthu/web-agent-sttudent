import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/profile ────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, email, country, role, field, interests, created_at, updated_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ profile: user });
    } catch (err) {
        next(err);
    }
});

// ── PUT /api/profile ────────────────────────────────────────
router.put('/', async (req, res, next) => {
    try {
        const { country, role, field, interests } = req.body;
        const updates = {};
        if (country !== undefined) updates.country = country;
        if (role !== undefined) updates.role = role;
        if (field !== undefined) updates.field = field;
        if (interests !== undefined) updates.interests = interests;
        updates.updated_at = new Date().toISOString();

        const { data: user, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select('id, email, country, role, field, interests, created_at, updated_at')
            .single();

        if (error) throw error;
        res.json({ profile: user });
    } catch (err) {
        next(err);
    }
});

export default router;
