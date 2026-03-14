import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { auth, currentUser } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const requestedRole = searchParams.get('role');

        // Always enforce authentication
        const { userId, role: userRole } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin хэрэглэгчдийн жагсаалтыг зөвхөн admin харж болно
        if (requestedRole === 'admin' && userRole !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const usersCollection = await getCollection('users');
        const messagesCollection = await getCollection('messages');
        const { userId: adminId } = await auth();

        let query = {};
        if (requestedRole === 'admin') {
            query = { role: 'admin' };
        }

        const users = await usersCollection.find(query, {
            projection: {
                _id: 1,
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                status: 1,
                lastSeen: 1,
                isInCall: 1,
                userId: 1
            }
        }).toArray();

        // Enhance users with real-time messaging data
        const enhancedUsers = await Promise.all(users.map(async (user) => {
            const userIdStr = user._id.toString();

            // 1. Calculate isOnline (within last 5 minutes)
            const isOnline = user.lastSeen &&
                (Date.now() - new Date(user.lastSeen).getTime()) < 5 * 60 * 1000;

            // 2. Count unread messages for the current admin
            let unreadCount = 0;
            if (adminId) {
                unreadCount = await messagesCollection.countDocuments({
                    receiverId: adminId,
                    senderId: userIdStr,
                    read: false
                });
            }

            // 3. Get the very last message in this conversation
            const lastMsgDoc = await messagesCollection.findOne(
                {
                    $or: [
                        { senderId: userIdStr, receiverId: adminId },
                        { senderId: adminId, receiverId: userIdStr }
                    ]
                },
                { sort: { createdAt: -1 } }
            );

            return {
                ...user,
                _id: userIdStr,
                id: userIdStr,
                isOnline,
                unreadCount,
                lastMessage: lastMsgDoc ? lastMsgDoc.content : ''
            };
        }));

        return NextResponse.json(enhancedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
