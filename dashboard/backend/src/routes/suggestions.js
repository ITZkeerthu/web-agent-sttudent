import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { fetchTrustedOffers, fetchOfferById } from '../services/offerService.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/suggestions ────────────────────────────────────
// Compare user's tracked offers against all available offers
// to find potentially better alternatives.
router.get('/', async (req, res, next) => {
    try {
        // Get user's tracked offers
        const { data: tracked } = await supabase
            .from('user_tracked_offers')
            .select('offer_id')
            .eq('user_id', req.user.id);

        const trackedIds = (tracked || []).map((t) => t.offer_id);

        if (!trackedIds.length) {
            return res.json({ suggestions: [] });
        }

        // Get all available offers
        const allOffers = await fetchTrustedOffers({ limit: 100 });

        // For each tracked offer, find a higher-scoring alternative in the same category
        const suggestions = [];
        let suggestionId = 1;

        for (const tid of trackedIds) {
            const current = allOffers.find((o) => o.id === tid);
            if (!current) continue;

            const better = allOffers.find(
                (o) =>
                    o.id !== tid &&
                    o.category === current.category &&
                    o.score > current.score &&
                    !trackedIds.includes(o.id),
            );

            if (better) {
                suggestions.push({
                    id: suggestionId++,
                    currentId: current.id,
                    betterId: better.id,
                    currentOffer: current,
                    betterOffer: better,
                    score: Math.min(99, Math.round((better.score - current.score) * 1.5 + 50)),
                    status: 'pending',
                });
            }
        }

        res.json({ suggestions });
    } catch (err) {
        next(err);
    }
});

export default router;
