import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        const orders = await getCollection('orders');
        const order = await orders.findOne({ _id: new ObjectId(id) });
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (userId && order.userId !== userId && order.userId !== 'guest') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ order: { ...order, _id: order._id.toString() } });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
