import { createClient, Entry, EntrySkeletonType } from 'contentful';

// Blog post fields interface matching the Contentful content type
interface BlogPostFields {
  title: string;
  slug: string;
  body?: string;
  excerpt?: string;
  publishDate?: string;
}

// Entry skeleton for type safety
interface BlogPostSkeleton extends EntrySkeletonType {
  contentTypeId: 'blogPost';
  fields: BlogPostFields;
}

export type BlogPost = Entry<BlogPostSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS'>;

// Initialize the Contentful Delivery client
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});

/**
 * Fetches all published blog posts from Contentful
 * Returns an array of posts with their slug and title
 */
export async function getAllPosts(): Promise<
  Array<{ slug: string; title: string; sys: { id: string } }>
> {
  const response = await client.getEntries<BlogPostSkeleton>({
    content_type: 'blogPost',
    order: ['-sys.createdAt'],
    select: ['fields.slug', 'fields.title', 'sys.id'],
  });

  return response.items.map((entry) => ({
    slug: entry.fields.slug,
    title: entry.fields.title,
    sys: { id: entry.sys.id },
  }));
}

/**
 * Fetches a single blog post by its slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await client.getEntries<BlogPostSkeleton>({
    content_type: 'blogPost',
    'fields.slug': slug,
    limit: 1,
  });

  return response.items[0] || null;
}

/**
 * Generates static params for all blog posts (for Next.js static generation)
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export { client };
