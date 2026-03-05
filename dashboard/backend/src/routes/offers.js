import { Router } from 'express';
import { fetchTrustedOffers, fetchOfferById, searchOffers } from '../services/offerService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/offers ─────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const { search, risk, limit = 50, offset = 0 } = req.query;
        const offers = await fetchTrustedOffers({
            search: search || undefined,
            riskFilter: risk || undefined,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        });
        res.json({ offers, total: offers.length });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/offers/search?q= ───────────────────────────────
router.get('/search', async (req, res, next) => {
    try {
        const q = req.query.q || '';
        const results = await searchOffers(q);
        res.json({ offers: results, total: results.length });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/offers/:id ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
    try {
        const offer = await fetchOfferById(parseInt(req.params.id, 10));
        if (!offer) return res.status(404).json({ error: 'Offer not found' });
        res.json({ offer });
    } catch (err) {
        next(err);
    }
});

export default router;
