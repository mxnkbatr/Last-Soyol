import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env variable is not set');
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const userId = (payload.sub || payload.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { lastSeen: new Date() } },
      { returnDocument: 'after' }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        status: user.status,
        name: user.name,
        image: user.image,
        email: user.email
      }
    });

  } catch (error) {
    // console.error('Me API Error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
