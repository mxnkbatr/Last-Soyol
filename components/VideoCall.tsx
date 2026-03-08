'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Phone, Mic, MicOff, VideoOff, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export interface VideoCallProps {
  prefilledRoom?: string;
  onBack?: () => void;
  onDisconnected?: () => void;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type CallRole = 'caller' | 'callee' | null;

export default function VideoCall({ prefilledRoom, onBack, onDisconnected }: VideoCallProps) {
  const [room, setRoom] = useState(prefilledRoom || '');
  const [inCall, setInCall] = useState(false);
  const [role, setRole] = useState<CallRole>(null);
  const [connecting, setConnecting] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(async (doDelete = false) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (doDelete && room.trim()) {
      await fetch(`/api/videocall/signal?room=${encodeURIComponent(room.trim())}`, { method: 'DELETE' }).catch(() => { });
    }
    setInCall(false);
    setRole(null);
    setConnecting(false);
  }, [room]);

  // ── Get local media ────────────────────────────────────────────────────────
  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
    }
    return stream;
  };

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  const createPC = (stream: MediaStream, roomName: string, callRole: CallRole) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = e => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = async e => {
      if (e.candidate) {
        await fetch('/api/videocall/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: roomName, role: callRole, iceCandidate: e.candidate }),
        }).catch(() => { });
      }
    };

    return pc;
  };

  // ── startCall (Caller) ─────────────────────────────────────────────────────
  const startCall = async () => {
    const roomName = room.trim();
    if (!roomName) { toast.error('Өрөөний нэр оруулна уу'); return; }
    setConnecting(true);

    try {
      const stream = await getLocalStream();
      const pc = createPC(stream, roomName, 'caller');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch('/api/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, role: 'caller', offer }),
      });

      setRole('caller');
      setInCall(true);
      setConnecting(false);
      toast.success('Дуудлага эхэллээ — нөгөө тал нэгдэхийг хүлээж байна');

      // Poll for answer
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/videocall/signal?room=${encodeURIComponent(roomName)}&role=caller`);
          const data = await res.json();
          if (data.answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            if (data.iceCandidates) {
              for (const c of data.iceCandidates) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
              }
            }
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          }
        } catch { /* ignore */ }
      }, 1500);

    } catch (err) {
      toast.error('Камер/мик нээж чадсангүй');
      await cleanup(false);
    }
  };

  // ── joinCall (Callee) ──────────────────────────────────────────────────────
  const joinCall = async () => {
    const roomName = room.trim();
    if (!roomName) { toast.error('Өрөөний нэр оруулна уу'); return; }
    setConnecting(true);

    try {
      // Poll for the offer
      let offer = null;
      for (let i = 0; i < 20; i++) {
        const res = await fetch(`/api/videocall/signal?room=${encodeURIComponent(roomName)}&role=callee`);
        const data = await res.json();
        if (data.offer) { offer = data.offer; break; }
        await new Promise(r => setTimeout(r, 1500));
      }
      if (!offer) { toast.error('Дуудлага олдсонгүй — өрөөний нэрийг шалгана уу'); setConnecting(false); return; }

      const stream = await getLocalStream();
      const pc = createPC(stream, roomName, 'callee');

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch('/api/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName, role: 'callee', answer }),
      });

      // Fetch caller ICE candidates
      const res2 = await fetch(`/api/videocall/signal?room=${encodeURIComponent(roomName)}&role=callee`);
      const data2 = await res2.json();
      if (data2.iceCandidates) {
        for (const c of data2.iceCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
        }
      }

      setRole('callee');
      setInCall(true);
      setConnecting(false);
      toast.success('Дуудлагад нэгдлээ!');

    } catch {
      toast.error('Нэгдэж чадсангүй');
      await cleanup(false);
    }
  };

  // ── hangUp ─────────────────────────────────────────────────────────────────
  const hangUp = async () => {
    await cleanup(true);
    toast('Дуудлага дууслаа', { icon: '📵' });
    onDisconnected?.();
  };

  // ── Mic / Cam toggles ──────────────────────────────────────────────────────
  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  // Cleanup on unmount
  useEffect(() => () => { cleanup(false); }, [cleanup]);

  // ── IN-CALL UI ─────────────────────────────────────────────────────────────
  if (inCall) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        {/* Remote video — fullscreen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* PiP local video — top right */}
        <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!camOn && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>

        {/* Room label */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-white text-xs font-semibold">{room}</span>
          </div>
        </div>

        {/* Controls — bottom center */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          {/* Mic */}
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${micOn ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white' : 'bg-red-500 text-white'
              }`}
          >
            {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Hang up */}
          <button
            onClick={hangUp}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all active:scale-95"
          >
            <Phone className="w-7 h-7 text-white rotate-[135deg]" />
          </button>

          {/* Cam */}
          <button
            onClick={toggleCam}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${camOn ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white' : 'bg-red-500 text-white'
              }`}
          >
            {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }

  // ── PRE-CALL UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Буцах</span>
          </button>
        )}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Видео дуудлага</h1>
          <p className="text-slate-600">Өрөөний нэр оруулж дуудлага эхлүүлнэ үү</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="room-input" className="block text-sm font-medium text-slate-700 mb-2">
              Өрөөний нэр
            </label>
            <input
              id="room-input"
              type="text"
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="my-room-123"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-base"
            />
            <p className="mt-1.5 text-xs text-slate-400">Нөгөө хүнтэйгээ адил нэр ашиглана уу</p>
          </div>

          {/* Primary — start call */}
          <button
            onClick={startCall}
            disabled={connecting || !room.trim()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {connecting && role === null ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Холбогдож байна...</span></>
            ) : (
              <><Phone className="w-5 h-5" /><span>Дуудлага эхлүүлэх</span></>
            )}
          </button>

          {/* Secondary — join */}
          <button
            onClick={joinCall}
            disabled={connecting || !room.trim()}
            className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <Video className="w-5 h-5" />
            <span>Нэгдэх</span>
          </button>
        </div>
      </div>
    </div>
  );
}
