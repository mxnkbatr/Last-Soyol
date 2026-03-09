import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const banners = await getCollection('banners');
        const result = await banners.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Banner Delete API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const updates = await request.json();

        // Remove _id or id from updates if they exist to prevent Mongo error
        delete updates._id;
        delete updates.id;

        const banners = await getCollection('banners');
        const result = await banners.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, updatedCount: result.modifiedCount });
    } catch (error) {
        console.error('[Banner Update API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
