import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, country, role, field, interests } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('profiles')
            .insert({
                email: email.toLowerCase(),
                password: hashedPassword,
                country: country || 'US',
                role: role || 'Student',
                field: field || 'CS',
                interests: interests || ['AI', 'Cloud'],
            })
            .select('id, email, country, role, field, interests, created_at')
            .single();

        if (error) throw error;

        const token = generateToken(user);
        res.status(201).json({ user, token });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);
        const { password: _, ...safeUser } = user;
        res.json({ user: safeUser, token });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/session ───────────────────────────────────
router.get('/session', authMiddleware, async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, email, country, role, field, interests, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        next(err);
    }
});

export default router;
