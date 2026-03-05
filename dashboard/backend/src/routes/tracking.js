import { Router } from 'express';
import supabase from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { transformOffer } from '../services/offerService.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/tracking ───────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const { data: tracked, error } = await supabase
            .from('user_tracked_offers')
            .select('offer_id')
            .eq('user_id', req.user.id);

        if (error) throw error;

        const trackedIds = (tracked || []).map((t) => t.offer_id);

        // Fetch the actual offer details for tracked items
        let offers = [];
        if (trackedIds.length > 0) {
            const { data: offerRows } = await supabase
                .from('offers')
                .select('*')
                .in('id', trackedIds);

            if (offerRows?.length) {
                const domainNames = [...new Set(offerRows.map((o) => o.domain).filter(Boolean))];
                const { data: domains } = await supabase
                    .from('domains')
                    .select('*')
                    .in('domain', domainNames);
                const domainMap = Object.fromEntries((domains || []).map((d) => [d.domain, d]));
                offers = offerRows.map((o) => transformOffer(o, domainMap[o.domain]));
            }
        }

        res.json({ trackedIds, offers });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/tracking/:offerId ─────────────────────────────
router.post('/:offerId', async (req, res, next) => {
    try {
        const offerId = parseInt(req.params.offerId, 10);
        const { error } = await supabase
            .from('user_tracked_offers')
            .upsert(
                { user_id: req.user.id, offer_id: offerId },
                { onConflict: 'user_id,offer_id' },
            );

        if (error) throw error;
        res.json({ tracked: true, offerId });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /api/tracking/:offerId ───────────────────────────
router.delete('/:offerId', async (req, res, next) => {
    try {
        const offerId = parseInt(req.params.offerId, 10);
        const { error } = await supabase
            .from('user_tracked_offers')
            .delete()
            .eq('user_id', req.user.id)
            .eq('offer_id', offerId);

        if (error) throw error;
        res.json({ tracked: false, offerId });
    } catch (err) {
        next(err);
    }
});

export default router;
