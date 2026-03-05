const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'kimi-k2.5:cloud';

/**
 * Send a chat request to Ollama.
 * @param {string} systemPrompt - System-level context.
 * @param {Array<{role:string, content:string}>} messages - Conversation history.
 * @returns {Promise<string>} The assistant's reply text.
 */
export async function ollamaChat(systemPrompt, messages) {
    const body = {
        model: OLLAMA_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
        ],
        stream: false,
    };

    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.message?.content || '';
}

/**
 * Check if Ollama is reachable and the model is available.
 */
export async function checkOllamaHealth() {
    try {
        const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return false;
        const data = await res.json();
        return data.models?.some((m) => m.name.startsWith(OLLAMA_MODEL.split(':')[0])) ?? false;
    } catch {
        return false;
    }
}
