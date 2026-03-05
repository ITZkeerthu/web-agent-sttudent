import supabase from '../config/supabase.js';

// ── Category inference rules ────────────────────────────────
const CATEGORY_RULES = [
    { pattern: /cloud|server|vps|hosting|aws|azure|gcp|compute|kubernetes/i, category: 'Cloud & Hosting' },
    { pattern: /ide|jetbrains|vscode|editor|intellij|pycharm|webstorm|code/i, category: 'Developer Tools' },
    { pattern: /design|figma|canva|adobe|photoshop|illustrator|creative/i, category: 'Design & Creative' },
    { pattern: /ai|machine.?learn|gpt|copilot|openai|anthropic|model/i, category: 'AI & ML' },
    { pattern: /domain|dns|ssl|certificate|registrar|namecheap/i, category: 'Domains & Certificates' },
    { pattern: /database|db|mongo|postgres|redis|firebase|supabase/i, category: 'Database' },
    { pattern: /email|mail|sendgrid|mailgun|smtp|newsletter/i, category: 'Email & Communication' },
    { pattern: /learn|course|udemy|coursera|education|university|academ/i, category: 'Education' },
    { pattern: /market|seo|analytics|ad|campaign|growth/i, category: 'Marketing' },
    { pattern: /storage|cdn|backup|file|s3|cloudflare/i, category: 'Storage & CDN' },
];

function inferCategory(title, description, benefits) {
    const haystack = `${title} ${description} ${(benefits || []).join(' ')}`;
    for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(haystack)) return rule.category;
    }
    return 'Software & Tools';
}

function inferRisk(score, domain) {
    if (domain?.is_blacklisted) return 'High';
    if (score >= 70 && domain?.trust_score >= 3) return 'Low';
    if (score >= 40) return 'Medium';
    return 'High';
}

function inferType(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (/free tier|always free|open.?source/i.test(text)) return 'Free Tier';
    if (/credit|coupon|\$\d/i.test(text)) return 'Credit';
    if (/trial|month.?free/i.test(text)) return 'Trial';
    if (/discount|%\s?off/i.test(text)) return 'Discount';
    return 'Offer';
}

function inferValue(title, description, benefits) {
    const text = `${title} ${description} ${(benefits || []).join(' ')}`;
    const dollarMatch = text.match(/\$[\d,.]+[kK]?/);
    if (dollarMatch) return dollarMatch[0];
    const creditMatch = text.match(/(\d[\d,]*)\s*(?:credits?|hours?|GB|TB)/i);
    if (creditMatch) return creditMatch[0];
    return 'Free access';
}

function inferDuration(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const match = text.match(/(\d+)\s*(year|month|day|week)s?/);
    if (match) return `${match[1]} ${match[2]}${parseInt(match[1]) > 1 ? 's' : ''}`;
    if (/always free|forever|lifetime/i.test(text)) return 'Ongoing';
    if (/annual|yearly/i.test(text)) return '1 year';
    return '12 months';
}

/**
 * Transform a DB offer row + domain data into the frontend shape.
 */
export function transformOffer(dbOffer, domainData) {
    const title = dbOffer.title || '';
    const description = dbOffer.description || '';
    const benefits = dbOffer.benefits_found || [];
    const score = dbOffer.score || 0;

    return {
        id: dbOffer.id,
        provider: title || domainData?.domain || 'Unknown',
        category: inferCategory(title, description, benefits),
        value: inferValue(title, description, benefits),
        duration: inferDuration(title, description),
        risk: inferRisk(score, domainData),
        region: 'Global',
        type: inferType(title, description),
        keywords: benefits.slice(0, 5).map((b) => b.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()).filter(Boolean),
        autoRenew: /auto.?renew|recurring/i.test(`${title} ${description}`) ? 'Yes' : 'No',
        cancelEase: score >= 60 ? 'Easy' : score >= 30 ? 'Moderate' : 'Hard',
        link: dbOffer.url || '#',
        description,
        benefits,
        score,
        discoveredAt: dbOffer.discovered_at,
    };
}

/**
 * Fetch trusted offers with optional filters.
 */
export async function fetchTrustedOffers({ search, riskFilter, limit = 50, offset = 0 } = {}) {
    // Fetch offers joined with domains using two-step query
    let offerQuery = supabase
        .from('offers')
        .select('*')
        .order('score', { ascending: false })
        .range(offset, offset + limit - 1);

    if (search) {
        offerQuery = offerQuery.or(
            `title.ilike.%${search}%,description.ilike.%${search}%,domain.ilike.%${search}%`
        );
    }

    const { data: offers, error: offersErr } = await offerQuery;
    if (offersErr) throw offersErr;
    if (!offers?.length) return [];

    // Fetch domains for the offers
    const domainNames = [...new Set(offers.map((o) => o.domain).filter(Boolean))];
    const { data: domains } = await supabase
        .from('domains')
        .select('*')
        .in('domain', domainNames);

    const domainMap = Object.fromEntries((domains || []).map((d) => [d.domain, d]));

    let result = offers.map((o) => transformOffer(o, domainMap[o.domain]));

    // Apply risk filter if specified
    if (riskFilter && riskFilter !== 'All') {
        result = result.filter((o) => o.risk === riskFilter);
    }

    return result;
}

/**
 * Fetch a single offer by ID.
 */
export async function fetchOfferById(id) {
    const { data: offer, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !offer) return null;

    const { data: domain } = await supabase
        .from('domains')
        .select('*')
        .eq('domain', offer.domain)
        .single();

    return transformOffer(offer, domain);
}

/**
 * Search offers with keyword scoring.
 */
export async function searchOffers(query) {
    if (!query?.trim()) return fetchTrustedOffers({ limit: 20 });

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .order('score', { ascending: false });

    if (!offers?.length) return [];

    const domainNames = [...new Set(offers.map((o) => o.domain).filter(Boolean))];
    const { data: domains } = await supabase
        .from('domains')
        .select('*')
        .in('domain', domainNames);

    const domainMap = Object.fromEntries((domains || []).map((d) => [d.domain, d]));

    // Score each offer by term matches
    const scored = offers.map((o) => {
        const hay = `${o.title} ${o.description} ${(o.benefits_found || []).join(' ')} ${o.domain}`.toLowerCase();
        const matchCount = terms.filter((t) => hay.includes(t)).length;
        return { offer: o, relevance: matchCount };
    });

    return scored
        .filter((s) => s.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance || (b.offer.score - a.offer.score))
        .map((s) => transformOffer(s.offer, domainMap[s.offer.domain]));
}
