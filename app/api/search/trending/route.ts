import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const products = await getCollection('products');

        // Find featured or highly-rated products to use as trending tags
        const trendingProducts = await products
            .find({ featured: true })
            .sort({ rating: -1, _id: -1 })
            .limit(5)
            .project({ name: 1 })
            .toArray();

        // Mapping to format the tag text nicely (e.g., extracting the first 2-3 words)
        const formattedTags = trendingProducts.map((p, idx) => {
            // Very basic extraction of the main product name (first 2-3 words)
            const words = p.name.split(' ');
            const text = words.slice(0, Math.min(words.length, 3)).join(' ');

            return {
                text,
                status: idx === 0 ? 'HOT' : idx === 1 ? 'NEW' : 'TREND',
            };
        });

        // Fallback if no featured products
        if (formattedTags.length === 0) {
            return NextResponse.json({
                trending: [
                    { text: 'Ухаалаг утас', status: 'HOT' },
                    { text: 'Чихэвч', status: 'NEW' },
                    { text: 'Зурагт', status: 'TREND' },
                ]
            });
        }

        return NextResponse.json({ trending: formattedTags });
    } catch (error) {
        console.error('[Trending Search API] Error:', error);
        return NextResponse.json({
            trending: [
                { text: 'iPhone', status: 'HOT' },
                { text: 'AirPods', status: 'NEW' },
                { text: 'PlayStation', status: 'TREND' },
            ]
        }, { status: 500 });
    }
}
