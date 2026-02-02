import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/contentful';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      title: post.fields.title,
      slug: post.fields.slug,
      body: post.fields.body || null,
      excerpt: post.fields.excerpt || null,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
