import supabase from '../config/supabase.js';
import { ollamaChat, checkOllamaHealth } from '../config/ollama.js';
import { searchOffers, fetchTrustedOffers } from './offerService.js';

// ── System prompt constraining the bot's scope ──────────────
const SYSTEM_PROMPT = `You are SmartSaver AI — a helpful assistant that finds student/developer deals, free trials, credits, and subscriptions.

RULES:
1. ONLY answer questions about software deals, student offers, free-tier services, cloud credits, trials, subscriptions, discounts, and related topics.
2. If asked about unrelated topics (politics, recipes, etc.), politely redirect: "I specialise in finding deals and offers. How can I help you save?"
3. When you find matching offers, reference them by name and summarise key details (value, duration, risk).
4. Be concise, friendly, and practical.
5. When comparing offers, highlight which is better and why.
6. If you don't know about a specific offer, say so instead of making things up.

CONTEXT — Here are the current offers in our database:
`;

/**
 * Build offer context string for the AI prompt.
 */
async function buildOfferContext(userMessage) {
    const [matched, top] = await Promise.all([
        searchOffers(userMessage).catch(() => []),
        fetchTrustedOffers({ limit: 10 }).catch(() => []),
    ]);

    // Merge unique offers
    const seen = new Set();
    const all = [];
    for (const o of [...matched, ...top]) {
        if (!seen.has(o.id)) {
            seen.add(o.id);
            all.push(o);
        }
    }

    if (!all.length) return { context: '\n(No offers in the database yet.)\n', offers: [] };

    const lines = all.map(
        (o) => `• ${o.provider} — ${o.category} | ${o.value} | ${o.duration} | Risk: ${o.risk} | ${o.type}`,
    );

    return { context: '\n' + lines.join('\n') + '\n', offers: all };
}

/**
 * Process a user chat message.
 * Returns { reply: string, offers: array }
 */
export async function processChat(userId, userMessage) {
    // Load last 20 messages for conversation context
    const { data: history } = await supabase
        .from('chat_messages')
        .select('sender, text')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(20);

    const conversationMessages = (history || []).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
    }));

    // Add the new user message
    conversationMessages.push({ role: 'user', content: userMessage });

    // Build context from offers
    const { context, offers } = await buildOfferContext(userMessage);
    const fullSystemPrompt = SYSTEM_PROMPT + context;

    let reply;
    const ollamaOk = await checkOllamaHealth();

    if (ollamaOk) {
        try {
            reply = await ollamaChat(fullSystemPrompt, conversationMessages);
        } catch (err) {
            console.error('Ollama error, using fallback:', err.message);
            reply = buildFallbackReply(userMessage, offers);
        }
    } else {
        console.warn('Ollama unavailable, using fallback reply.');
        reply = buildFallbackReply(userMessage, offers);
    }

    // Save user message + AI reply to DB
    const offerIds = offers.slice(0, 5).map((o) => o.id);
    await supabase.from('chat_messages').insert([
        { user_id: userId, sender: 'user', text: userMessage },
        { user_id: userId, sender: 'ai', text: reply, offer_ids: offerIds },
    ]);

    return { reply, offers: offers.slice(0, 6) };
}

/**
 * Fallback reply when Ollama is unavailable.
 */
function buildFallbackReply(userMessage, offers) {
    if (!offers.length) {
        return `I couldn't find specific offers matching "${userMessage}" right now. Try searching for cloud credits, developer tools, or student discounts.`;
    }
    const names = offers.slice(0, 3).map((o) => `**${o.provider}** (${o.value})`).join(', ');
    return `Here are some offers related to your query: ${names}. Would you like more details on any of these?`;
}

/**
 * Get chat history for a user.
 */
export async function getChatHistory(userId, limit = 50) {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Clear chat history for a user.
 */
export async function clearChatHistory(userId) {
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
}
