import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Loader2 } from 'lucide-react';
import { apiSendChat, apiGetChatHistory } from '../../api/client';
import ChatSuggestionCard from './ChatSuggestionCard';

/**
 * AI chat interface — Liquid Glass theme.
 */
export default function ChatInterface({ profile, trackedItems, toggleTrack }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const scrollRef = useRef(null);
    const hasLoadedHistory = useRef(false);

    // Load chat history on mount
    useEffect(() => {
        if (hasLoadedHistory.current) return;
        hasLoadedHistory.current = true;

        apiGetChatHistory(50)
            .then(({ messages: history }) => {
                if (history?.length) {
                    const mapped = history.map((m) => ({
                        id: m.id,
                        text: m.text,
                        sender: m.sender,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }));
                    setMessages(mapped);
                } else {
                    // Show welcome message
                    setMessages([{
                        id: 'welcome',
                        text: "Welcome! I'm your SmartSaver assistant. Ask me about student deals, free trials, cloud credits, or developer tools.",
                        sender: 'ai',
                        timestamp: 'Just now',
                    }]);
                }
            })
            .catch(() => {
                setMessages([{
                    id: 'welcome',
                    text: "Welcome! I'm your SmartSaver assistant. Ask me about student deals, free trials, cloud credits, or developer tools.",
                    sender: 'ai',
                    timestamp: 'Just now',
                }]);
            });
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isAiTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userMsg = { id: Date.now(), text: input, sender: 'user', timestamp: 'Just now' };
        setMessages((prev) => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsAiTyping(true);

        try {
            const { reply, offers } = await apiSendChat(currentInput);
            const aiResponse = {
                id: Date.now() + 1,
                sender: 'ai',
                timestamp: 'Just now',
                text: reply,
                offers: offers || [],
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'ai', timestamp: 'Just now', text: 'Sorry, something went wrong. Please try again.' },
            ]);
        } finally {
            setIsAiTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'transparent' }}>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 glass-scroll">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`w-full max-w-full flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'glow-pink' : 'glow-cyan'
                                        }`}
                                    style={{
                                        background: msg.sender === 'user' ? 'var(--grad-primary)' : 'var(--bg-glass-strong)',
                                        border: msg.sender === 'user' ? 'none' : '1px solid var(--clr-glass-edge-2)',
                                        color: 'var(--clr-white)',
                                    }}
                                >
                                    <User size={16} />
                                </div>

                                {/* Bubble */}
                                <div
                                    className={`p-4 shadow-sm text-sm leading-relaxed ${msg.sender === 'user'
                                            ? 'bubble-user rounded-[1.5rem] rounded-tr-none'
                                            : 'bubble-ai rounded-[1.5rem] rounded-tl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>

                            {/* Suggestion cards from AI response offers */}
                            {msg.offers?.length > 0 && (
                                <div className="mt-3 ml-11 flex flex-wrap gap-4 w-[calc(100%-44px)]">
                                    {msg.offers.map((offer) => (
                                        <ChatSuggestionCard key={offer.id} offer={offer} trackedItems={trackedItems} toggleTrack={toggleTrack} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* AI typing indicator */}
                {isAiTyping && (
                    <div className="flex gap-3 items-center ml-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse glow-cyan"
                            style={{ background: 'var(--bg-glass-strong)', color: 'var(--clr-cyan)' }}>
                            <Loader2 size={14} />
                        </div>
                        <div className="px-4 py-2 rounded-2xl flex gap-1" style={{ background: 'var(--bg-glass)' }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--clr-cyan)' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--clr-purple)', animationDelay: '0.1s' }} />
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--clr-pink)', animationDelay: '0.2s' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10"
                style={{ background: 'linear-gradient(to top, var(--bg-base), transparent)' }}>
                <form onSubmit={handleSend} className="max-w-3xl mx-auto relative group">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about 'free vps'..."
                        className="glass-input w-full p-5 pr-16 text-sm"
                        style={{ boxShadow: 'var(--glass-shadow)' }}
                    />
                    <button
                        type="submit"
                        className="btn-primary absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
