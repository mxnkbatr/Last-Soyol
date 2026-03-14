import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const CheckoutSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1).max(99)
  })).min(1).max(20),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string(),
  district: z.string(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    // 1. Validation
    const validation = CheckoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error.format() }, { status: 400 });
    }

    const { items, ...userDetails } = validation.data;
    const { clientPromise } = await import('@/lib/mongodb');
    const client = await clientPromise;
    const session = client.startSession();

    try {
      let orderId: string | null = null;

      await session.withTransaction(async () => {
        const db = client.db();
        const productsCollection = db.collection('products');
        const ordersCollection = db.collection('orders');

        // 2. Fetch products and check stock
        const productIds = items.map(item => new ObjectId(item.id));
        const dbProducts = await productsCollection.find({ _id: { $in: productIds } }, { session }).toArray();

        const storesCollection = db.collection('stores');

        let totalPrice = 0;
        const orderItems = [];

        for (const item of items) {
          const product = dbProducts.find((p: any) => p._id.toString() === item.id);

          if (!product) throw new Error(`Product not found: ${item.id}`);

          // Inventory Check
          if (product.stockStatus === 'in-stock' && (product.inventory || 0) < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.inventory || 0}`);
          }

          // Vendor & Commission Calculation
          const vendorId = product.vendorId;
          let commissionAmount = 0;
          let vendorAmount = product.price * item.quantity;

          if (vendorId) {
            const store = await storesCollection.findOne({ vendorId }, { session });
            const commissionRate = store?.commissionRate || 10;
            commissionAmount = (product.price * item.quantity) * (commissionRate / 100);
            vendorAmount = (product.price * item.quantity) - commissionAmount;
          }

          totalPrice += product.price * item.quantity;
          orderItems.push({
            id: item.id,
            productId: item.id, // For fallback
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.image || '',
            vendorId: vendorId || null,
            commissionAmount,
            vendorAmount
          });
        }

        // 3. Create Order
        const newOrder = {
          ...userDetails,
          userId: userId || 'guest',
          items: orderItems,
          totalPrice,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await ordersCollection.insertOne(newOrder, { session });
        orderId = result.insertedId.toString();

        // 4. Update Inventory
        for (const item of items) {
          await productsCollection.updateOne(
            { _id: new ObjectId(item.id), stockStatus: 'in-stock' },
            { $inc: { inventory: -item.quantity } },
            { session }
          );
        }
      });

      return NextResponse.json({
        success: true,
        orderId,
        message: 'Order placed successfully'
      });

    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('[Checkout API] Error:', error);
    return NextResponse.json({
      error: error.message?.includes('stock') || error.message?.includes('бараа')
        ? error.message
        : 'Захиалга үүсгэхэд алдаа гарлаа'
    }, { status: 500 });
  }
}
