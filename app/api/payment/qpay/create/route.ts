import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { createInvoice } from '@/lib/qpay';
import { ObjectId } from 'mongodb';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, amount, description } = body;

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 });
        }

        const ordersCollection = await getCollection('orders');
        const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.userId !== userId && order.userId !== 'guest') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Create QPay Invoice
        const qpayData = await createInvoice({
            orderId,
            amount,
            description: description || `Order #${orderId}`
        });

        // 2. Store invoiceId in order
        await ordersCollection.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { qpayInvoiceId: qpayData.invoiceId, updatedAt: new Date() } }
        );

        return NextResponse.json(qpayData);
    } catch (error: any) {
        console.error('[QPay Create API] Error:', error);
        return NextResponse.json({ error: error.message || 'Invoice creation failed' }, { status: 500 });
    }
}
