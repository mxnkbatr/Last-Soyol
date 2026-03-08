'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Loader2, BarChart3, Package, ShoppingCart, MessageCircle, Tag, Layers,
    Video, Phone
} from 'lucide-react';
import UserList from '@/components/Chat/UserList';
import ChatWindow from '@/components/Chat/ChatWindow';
import { motion } from 'framer-motion';
import VideoCall from '@/components/VideoCall';

interface User {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    userId: string;
    role?: string;
    isOnline?: boolean;
    lastMessage?: string;
    unreadCount?: number;
}

export default function AdminMessagesPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewFilter, setViewFilter] = useState<'all' | 'clients' | 'admins'>('all');

    // Call State
    const [callRoom, setCallRoom] = useState('');
    const [isCallActive, setIsCallActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Mobile View State: 'list' | 'chat' | 'call'
    const [mobileView, setMobileView] = useState<'list' | 'chat' | 'call'>('list');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                const data = await res.json();
                setUsers(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch users', err);
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (viewFilter === 'all') {
            setFilteredUsers(users);
        } else if (viewFilter === 'admins') {
            setFilteredUsers(users.filter(u => u.role === 'admin'));
        } else {
            setFilteredUsers(users.filter(u => u.role !== 'admin'));
        }
    }, [users, viewFilter]);

    // Timer logic
    useEffect(() => {
        if (isCallActive) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setCallDuration(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isCallActive]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartCall = async () => {
        if (!selectedUser) return;

        const room = `call-${Date.now()}`;
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: selectedUser.userId,
                    content: `📹 Видео дуудлага эхэллээ: ${room}`,
                    type: 'call_invite',
                    roomName: room
                })
            });

            setCallRoom(room);
            setIsCallActive(true);
            setMobileView('call');
        } catch (e) {
            console.error(e);
        }
    };

    const onDisconnected = () => {
        setIsCallActive(false);
        setCallRoom('');
        setMobileView('chat');
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setMobileView('chat');
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-screen bg-slate-950 relative">
            {/* Header (Desktop & Mobile when not in call) */}
            {!isCallActive && (
                <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl shrink-0 z-20">
                    <div className="pl-16 pr-4 sm:pl-20 sm:pr-8 lg:px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">Мессеж & Дуудлага</h1>
                                <p className="text-xs text-slate-400 mt-1">Хэрэглэгчидтэй харилцах</p>
                            </div>
                        </div>

                        {/* Call Status Indicator (Desktop Header) */}
                        {isCallActive && (
                            <div className="hidden md:flex items-center gap-4 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                <div className="relative">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full relative" />
                                </div>
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Дуудлага идэвхтэй</span>
                                <div className="w-px h-4 bg-emerald-500/20" />
                                <span className="text-sm font-mono font-bold text-white">{formatDuration(callDuration)}</span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            <main className="flex-1 flex overflow-hidden relative">
                {loading ? (
                    <div className="w-full flex justify-center items-center"><Loader2 className="animate-spin text-amber-500 w-10 h-10" /></div>
                ) : (
                    <>
                        {/* User List Sidebar */}
                        <div className={`
                            ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'} 
                            w-full lg:w-80 h-full flex-col border-r border-slate-800 bg-slate-900/30
                        `}>
                            {/* Filter Tabs */}
                            <div className="flex p-2 gap-1 bg-slate-900/50 border-b border-slate-800">
                                {(['all', 'clients', 'admins'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setViewFilter(f)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewFilter === f
                                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {f === 'all' ? 'Бүгд' : f === 'clients' ? 'Хэрэглэгч' : 'Админ'}
                                    </button>
                                ))}
                            </div>

                            <UserList
                                users={filteredUsers}
                                selectedUser={selectedUser}
                                onSelectUser={handleSelectUser}
                            />
                        </div>

                        {/* Chat / Call Content Area */}
                        <div className={`
                            ${mobileView !== 'list' ? 'flex' : 'hidden lg:flex'} 
                            flex-1 h-full flex-col relative
                        `}>
                            {isCallActive ? (
                                <VideoCall prefilledRoom={callRoom} onDisconnected={onDisconnected} />
                            ) : (
                                <div className="flex-1 h-full bg-slate-950/30 flex flex-col">
                                    {selectedUser ? (
                                        <ChatWindow
                                            otherUser={selectedUser}
                                            onStartCall={handleStartCall}
                                            onBack={() => setMobileView('list')}
                                        />
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-950 decoration-slate-900 border-l border-slate-800">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="w-24 h-24 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-6 relative"
                                            >
                                                <MessageCircle className="w-10 h-10 text-slate-600" />
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full animate-pulse flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-amber-300 rounded-full" />
                                                </div>
                                            </motion.div>
                                            <h3 className="text-xl font-bold text-white mb-2">Харилцагчаа сонгоно уу</h3>
                                            <p className="text-sm max-w-xs text-slate-500">
                                                Хэрэглэгчидтэй шууд чатлах эсвэл видео дуудлага хийж бараагаа танилцуулах боломжтой
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
