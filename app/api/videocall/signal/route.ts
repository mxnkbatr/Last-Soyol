import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

// POST — store offer / answer / ICE candidate
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { room, role, offer, answer, iceCandidate } = body;

        if (!room || !role) {
            return NextResponse.json({ error: 'room and role required' }, { status: 400 });
        }

        const col = await getCollection('videocall_signals');

        if (offer) {
            await col.updateOne(
                { room },
                { $set: { room, offer, updatedAt: new Date() } },
                { upsert: true }
            );
        }

        if (answer) {
            await col.updateOne(
                { room },
                { $set: { answer, updatedAt: new Date() } }
            );
        }

        if (iceCandidate) {
            const field = role === 'caller' ? 'callerIce' : 'calleeIce';
            const update = { $push: { [field]: iceCandidate } };
            await col.updateOne({ room }, update as Parameters<typeof col.updateOne>[1]);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('signal POST error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET — return offer/answer/ICE for a room
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const room = searchParams.get('room');
        const role = searchParams.get('role'); // 'caller' | 'callee'

        if (!room) {
            return NextResponse.json({ error: 'room required' }, { status: 400 });
        }

        const col = await getCollection('videocall_signals');
        const doc = await col.findOne({ room });

        if (!doc) {
            return NextResponse.json({ offer: null, answer: null, iceCandidates: [] });
        }

        // Callee needs: offer + caller ICE
        // Caller needs: answer + callee ICE
        if (role === 'callee') {
            return NextResponse.json({
                offer: doc.offer ?? null,
                answer: doc.answer ?? null,
                iceCandidates: doc.callerIce ?? [],
            });
        } else {
            return NextResponse.json({
                offer: doc.offer ?? null,
                answer: doc.answer ?? null,
                iceCandidates: doc.calleeIce ?? [],
            });
        }
    } catch (err) {
        console.error('signal GET error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE — clean up room
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const room = searchParams.get('room');

        if (!room) {
            return NextResponse.json({ error: 'room required' }, { status: 400 });
        }

        const col = await getCollection('videocall_signals');
        await col.deleteOne({ room });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('signal DELETE error', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
