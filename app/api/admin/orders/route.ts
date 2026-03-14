import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/lib/auth';
import { sendOrderStatusUpdate } from '@/lib/email';

// Get all orders (Admin only)
export async function GET(request: Request) {
    try {
        const { userId: authUserId, role } = await auth();
        if (!authUserId || role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        const ordersCollection = await getCollection('orders');

        let query = {};
        if (targetUserId) {
            query = { userId: targetUserId };
        }

        const orders = await ordersCollection.find(query).sort({ createdAt: -1 }).toArray();

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Update order (Status, Delivery Estimate)
export async function PUT(request: Request) {
    try {
        const { userId, role } = await auth();
        if (!userId || role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { orderId, status, deliveryEstimate } = await request.json();

        if (status) {
            const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!allowedStatuses.includes(status)) {
                return NextResponse.json({ error: 'Буруу статус' }, { status: 400 });
            }
        }

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const ordersCollection = await getCollection('orders');
        const existingOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updateData: any = { updatedAt: new Date() };
        if (status) updateData.status = status;
        if (deliveryEstimate !== undefined) updateData.deliveryEstimate = deliveryEstimate;

        const result = await ordersCollection.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: updateData }
        );

        // Send notification to customer (Non-blocking)
        if (existingOrder.userId && status) {
            try {
                let title = '';
                let message = '';

                if (status === 'confirmed') {
                    title = '✅ Захиалга баталгаажлаа!';
                    message = `Таны захиалга баталгаажлаа. Хүргэлт: ${deliveryEstimate || existingOrder.deliveryEstimate || 'Тодорхойлогдоно'}`;
                } else if (status === 'delivered') {
                    title = '🚚 Захиалга хүргэгдлээ!';
                    message = 'Таны захиалга амжилттай хүргэгдлээ. Баярлалаа!';
                }

                if (title && message) {
                    const notificationsCollection = await getCollection('notifications');
                    await notificationsCollection.insertOne({
                        userId: existingOrder.userId,
                        title,
                        message,
                        type: 'order',
                        isRead: false,
                        link: '/orders',
                        createdAt: new Date()
                    });
                }
                // Send Email (Non-blocking)
                (async () => {
                    try {
                        const usersCollection = await getCollection('users');
                        const owner = await usersCollection.findOne({ _id: new ObjectId(existingOrder.userId) });
                        if (owner?.email) {
                            await sendOrderStatusUpdate(
                                { ...existingOrder, deliveryEstimate: deliveryEstimate || existingOrder.deliveryEstimate },
                                owner.email,
                                status
                            );
                        }
                    } catch (e) { console.error('Status update email error:', e); }
                })();
            } catch (notifError) {
                console.error('Failed to send customer notification:', notifError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
