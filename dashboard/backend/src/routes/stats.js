import { Router } from 'express';
import supabase from '../config/supabase.js';

const router = Router();

// ── GET /api/stats ──────────────────────────────────────────
router.get('/', async (_req, res, next) => {
    try {
        // Get latest system_stats row
        const { data: stats } = await supabase
            .from('system_stats')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        // Get aggregate counts
        const [offersRes, domainsRes] = await Promise.all([
            supabase.from('offers').select('id', { count: 'exact', head: true }),
            supabase.from('domains').select('domain', { count: 'exact', head: true }),
        ]);

        res.json({
            latestCycle: stats || null,
            totalOffers: offersRes.count || 0,
            totalDomains: domainsRes.count || 0,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
