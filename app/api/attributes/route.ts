
import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const attributesCollection = await getCollection('attributes');
    const attributes = await attributesCollection.find({}).toArray();
    return NextResponse.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json({ error: 'Failed to fetch attributes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, role } = await auth();
    if (!userId || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, type, options } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const attributesCollection = await getCollection('attributes');

    // Check if attribute already exists
    const existing = await attributesCollection.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: 'Attribute already exists' }, { status: 400 });
    }

    const newAttribute = {
      name,
      type,
      options: options || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await attributesCollection.insertOne(newAttribute);

    return NextResponse.json({ ...newAttribute, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Error creating attribute:', error);
    return NextResponse.json({ error: 'Failed to create attribute' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, role } = await auth();
    if (!userId || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, type, options } = body;

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const attributesCollection = await getCollection('attributes');

    await attributesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          type,
          options,
          updatedAt: new Date()
        }
      }
    );

    // IMMEDIATE UPDATE: If name changed, we might need to update products, 
    // but since we will likely store attribute ID in products, the name change 
    // will propagate automatically on fetch if we join.
    // However, if products store the name snapshots, we would need to update them here.
    // For this implementation, let's assume products will store { attributeId: ObjectId, value: any }.

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating attribute:', error);
    return NextResponse.json({ error: 'Failed to update attribute' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, role } = await auth();
    if (!userId || role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const attributesCollection = await getCollection('attributes');
    await attributesCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    return NextResponse.json({ error: 'Failed to delete attribute' }, { status: 500 });
  }
}
