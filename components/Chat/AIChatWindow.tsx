'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Bot, User, Sparkles, ChevronLeft, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '@/hooks/useTranslation';
import ProductCard from './ProductCard';
import AddressConfirmationCard from './AddressConfirmationCard';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useChat } from '@ai-sdk/react';

interface AIChatWindowProps {
    onBack: () => void;
}

interface ExtendedMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system' | 'data' | 'tool';
    content: string;
    experimental_attachments?: Array<{
        name?: string;
        contentType?: string;
        url: string;
    } | string>;
    createdAt?: Date;
}

export default function AIChatWindow({ onBack }: AIChatWindowProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const addItem = useCartStore((s) => s.addItem);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedActions = useRef<Set<string>>(new Set());

    // Attachment state
    const [attachment, setAttachment] = useState<string | null>(null);
    const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [input, setInput] = useState('');

    const chatOptions: any = {
        api: '/api/chat',
        onError: (error: any) => {
            console.error('Chat error:', error);
            const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error);
            alert(`Google Gemini API Error:\n${msg}`);
            if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
                toast.error('Систем ачаалалтай байна. Дараа дахин оролдоно уу.');
            } else if (msg.toLowerCase().includes('api key')) {
                toast.error('AI үйлчилгээний түлхүүр буруу эсвэл идэвхгүй байна.');
            } else {
                toast.error('Алдаа гарлаа. Дахин оролдоно уу.');
            }
        },
        onFinish: (message: any) => {
            console.log('Chat finished:', message);
        }
    };
    const { messages: rawMessages, status, sendMessage, regenerate, stop, error } = useChat(chatOptions);

    // Cast messages to our ExtendedMessage type to avoid TS errors
    const messages = rawMessages as unknown as ExtendedMessage[];

    const isLoading = status === 'streaming' || status === 'submitted';
    const append = sendMessage; // Alias for compatibility if needed, or just use sendMessage
    const reload = regenerate;

    // Check API Key availability in Browser Console as requested
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (apiKey) {
            console.log('%c[DEBUG] Gemini API Key is LOADED:', 'color: green; font-weight: bold;', apiKey);
            console.log('Key length:', apiKey.length);
        } else {
            console.error('%c[DEBUG] Gemini API Key is MISSING in Client Environment!', 'color: red; font-weight: bold;');
        }

        // Debug useChat return values
        console.log('useChat debug:', {
            status,
            isLoading: status === 'streaming' || status === 'submitted',
            hasSendMessage: typeof sendMessage === 'function',
            hasRegenerate: typeof regenerate === 'function',
            hasStop: typeof stop === 'function'
        });
    }, [status, sendMessage, regenerate, stop]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, attachment]);

    // Action parsing effect
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.content) {
            const actionRegex = /\[ACTION:([A-Z_]+):(.*?):END_ACTION\]/g;
            let match;
            while ((match = actionRegex.exec(lastMessage.content)) !== null) {
                const fullMatch = match[0];
                const actionType = match[1];
                const actionContent = match[2];

                if (!processedActions.current.has(fullMatch)) {
                    processedActions.current.add(fullMatch);

                    if (actionType === 'ADD_TO_CART_DATA') {
                        try {
                            const parsed = JSON.parse(actionContent);
                            addItem({
                                id: parsed.id,
                                name: parsed.name,
                                price: parsed.price,
                                image: parsed.image || '/placeholder.png',
                                category: 'general',
                                stockStatus: 'in-stock',
                            });
                            toast.success('Сагсанд нэмэгдлээ! 🛒');
                        } catch (e) {
                            console.error('Failed to parse product data for cart', e);
                        }
                    } else if (actionType === 'NAVIGATE') {
                        router.push(actionContent);
                        toast.success('Хуудас руу шилжиж байна...');
                    }
                }
            }
        }
    }, [messages, addItem, router]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setAttachment(base64);
            setAttachmentType(file.type.startsWith('video') ? 'video' : 'image');
        };
        reader.readAsDataURL(file);
    };

    const clearAttachment = () => {
        setAttachment(null);
        setAttachmentType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const safeInput = input || '';
        if ((!safeInput.trim() && !attachment) || isLoading) {
            return;
        }

        const currentAttachment = attachment;

        try {
            const contentParts: any[] = [];
            if (safeInput.trim()) {
                contentParts.push({ type: 'text', text: safeInput.trim() });
            }
            if (currentAttachment) {
                contentParts.push({ type: 'image', image: currentAttachment });
            }

            // Construct the message object
            // Use simple string if no attachment, otherwise content parts
            const content = currentAttachment ? contentParts : safeInput.trim();
            const messagePayload = {
                role: 'user',
                content: content
            };

            // Use sendMessage
            if (typeof sendMessage === 'function') {
                // @ts-ignore
                await sendMessage(messagePayload);
            } else {
                console.error('sendMessage function is missing from useChat');
                alert('System Error: Chat function "sendMessage" is missing. Please refresh the page.');
            }

            setInput('');
            clearAttachment();
        } catch (e) {
            console.error('Failed to send message', e);
            toast.error('Зурвас илгээхэд алдаа гарлаа');
        }
    };

    const renderMessageContent = (content: any) => {
        let textContent = '';
        if (typeof content === 'string') {
            textContent = content;
        } else if (Array.isArray(content)) {
            textContent = content.map((p) => (p && p.type === 'text' ? p.text : '')).join(' ');
        } else if (content && typeof content === 'object' && typeof (content as any).text === 'string') {
            textContent = (content as any).text;
        }

        // Remove all ACTION tags and their content for professional UI
        const cleanContent = (textContent || '').replace(/\[ACTION:.*?:END_ACTION\]/g, '');

        const regex = /\[(PRODUCT_CARD|ADDRESS_CONFIRMATION):\s*(\{[\s\S]*?\})\]/g;
        const parts: Array<{ type: string; content?: string; data?: any }> = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(cleanContent)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: cleanContent.slice(lastIndex, match.index) });
            }

            try {
                const type = match[1];
                const data = JSON.parse(match[2]);
                parts.push({ type: type, data: data });
            } catch (e) {
                console.error('Failed to parse card JSON', e);
                parts.push({ type: 'text', content: match[0] });
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < cleanContent.length) {
            parts.push({ type: 'text', content: cleanContent.slice(lastIndex) });
        }

        const textParts = parts.filter(p => p.type === 'text' && p.content && p.content.trim().length);
        const productCards = parts.filter(p => p.type === 'PRODUCT_CARD' && p.data);
        const addressCards = parts.filter(p => p.type === 'ADDRESS_CONFIRMATION' && p.data);

        return (
            <div className="space-y-4">
                {textParts.map((part, idx) => (
                    <div key={`t-${idx}`} className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
                        <ReactMarkdown>{part.content as string}</ReactMarkdown>
                    </div>
                ))}

                {productCards.length > 0 && (
                    <div className="relative -mx-5 px-5">
                        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x snap-mandatory">
                            {productCards.map((part, idx) => (
                                <motion.div
                                    key={`pc-${idx}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="shrink-0 w-[240px] snap-center"
                                >
                                    <ProductCard product={part.data} />
                                </motion.div>
                            ))}
                        </div>
                        {/* Visual cue for horizontal scroll */}
                        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none" />
                    </div>
                )}

                {addressCards.map((part, idx) => (
                    <AddressConfirmationCard key={`ac-${idx}`} data={part.data} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-800/50 backdrop-blur-md shrink-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" strokeWidth={1.2} />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={1.2} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{t('chat', 'aiAssistant')}</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user'
                            ? 'bg-[#FF5000] ring-2 ring-orange-500/30'
                            : 'bg-gradient-to-tr from-blue-600 to-cyan-400 ring-2 ring-blue-500/30'
                            }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" strokeWidth={1.2} /> : <Bot className="w-4 h-4 text-white" strokeWidth={1.2} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${msg.role === 'user'
                            ? 'bg-[#FF5000] text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                            }`}>
                            {msg.experimental_attachments && msg.experimental_attachments.length > 0 && (
                                <div className="mb-2">
                                    {msg.experimental_attachments.map((att: any, i: number) => {
                                        const src = typeof att === 'string' ? att : att.url;
                                        const isVideo = src?.startsWith('data:video') || src?.endsWith('.mp4');
                                        return (
                                            <div key={i}>
                                                {isVideo ? (
                                                    <video src={src} controls className="max-w-full rounded-2xl max-h-48" />
                                                ) : (
                                                    <img src={src} alt="User upload" className="max-w-full rounded-2xl max-h-48 object-cover shadow-sm" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="leading-relaxed">
                                {renderMessageContent(msg.content)}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-blue-500/30">
                            <Bot className="w-4 h-4 text-white" strokeWidth={1.2} />
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5 flex items-center gap-1.5 h-[46px]">
                            {/* Lottie-like modern typing indicator */}
                            <span className="w-1.5 h-1.5 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-full animate-bounce"></span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 w-full p-4 pb-8 bg-slate-900/80 backdrop-blur-md border-t border-white/10 z-20">
                {attachment && (
                    <div className="absolute -top-16 left-4 bg-slate-800 p-2 rounded-lg border border-white/10 flex items-center gap-2 shadow-lg">
                        {attachmentType === 'video' ? (
                            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-xs">Video</div>
                        ) : (
                            <img src={attachment} alt="Preview" className="w-10 h-10 rounded object-cover" />
                        )}
                        <button onClick={clearAttachment} className="p-1 hover:bg-slate-700 rounded-full">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                )}
                <form
                    onSubmit={onFormSubmit}
                    className="relative flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm p-2 rounded-3xl border border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-lg"
                >
                    <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        title="Зураг/Видео оруулах"
                    >
                        <ImageIcon className="w-5 h-5" strokeWidth={1.2} />
                    </button>

                    <input
                        type="text"
                        value={input || ''}
                        onChange={handleInputChange}
                        placeholder={t('chat', 'typeMessage')}
                        className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 px-3 py-2 text-sm sm:text-base outline-none w-full min-w-0"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={((!input || !input.trim()) && !attachment) || isLoading}
                        className="p-3 bg-[#FF5000] text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25 transition-all active:scale-95 shrink-0"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.2} /> : <Send className="w-4 h-4" strokeWidth={1.2} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
