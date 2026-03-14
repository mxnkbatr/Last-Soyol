import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { rateLimit } from '@/lib/api-middleware';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!rateLimit(`check-user-${ip}`, 10, 60000)) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const users = await getCollection('users');
        const user = await users.findOne({ phone });

        return NextResponse.json({ exists: !!user });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
