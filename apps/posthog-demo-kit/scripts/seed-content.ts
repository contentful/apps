/**
 * Contentful Content Seeder
 *
 * Creates demo blog posts in Contentful if they don't already exist.
 * Also creates the blogPost content type if needed.
 *
 * Usage: npm run seed:content
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, Environment } from 'contentful-management';

// Demo blog posts to create
const DEMO_POSTS = [
  {
    title: 'Getting Started with Analytics',
    slug: 'getting-started-with-analytics',
    excerpt: 'Learn how to set up analytics tracking for your website.',
    body: 'Analytics helps you understand how users interact with your content. This guide covers the basics of setting up tracking and interpreting data.',
  },
  {
    title: 'Understanding User Behavior',
    slug: 'understanding-user-behavior',
    excerpt: 'Dive deep into user behavior patterns and insights.',
    body: 'User behavior analysis reveals how visitors navigate your site, which content resonates, and where they drop off. This knowledge is crucial for optimization.',
  },
  {
    title: 'Session Replays: A Complete Guide',
    slug: 'session-replays-complete-guide',
    excerpt: 'Master session replay tools to improve UX.',
    body: 'Session replays let you watch real user sessions to identify UX issues. Learn how to analyze recordings effectively and prioritize fixes.',
  },
  {
    title: 'Feature Flags for Product Teams',
    slug: 'feature-flags-for-product-teams',
    excerpt: 'How to use feature flags for safer releases.',
    body: 'Feature flags allow you to deploy code without releasing features. Roll out to a percentage of users, A/B test, and instantly roll back if needed.',
  },
  {
    title: 'Building Data-Driven Content',
    slug: 'building-data-driven-content',
    excerpt: 'Use analytics to create content that converts.',
    body: 'Data-driven content strategy uses analytics insights to guide what you create. Learn to identify high-performing topics and optimize for engagement.',
  },
];

// Content type definition for blogPost
const BLOG_POST_CONTENT_TYPE = {
  name: 'Blog Post',
  description: 'A blog post with title, slug, and content',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      required: true,
      localized: false,
    },
    {
      id: 'slug',
      name: 'Slug',
      type: 'Symbol',
      required: true,
      localized: false,
      validations: [
        {
          unique: true,
        },
        {
          regexp: {
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
            flags: null,
          },
          message: 'Slug must be lowercase with hyphens only',
        },
      ],
    },
    {
      id: 'excerpt',
      name: 'Excerpt',
      type: 'Symbol',
      required: false,
      localized: false,
    },
    {
      id: 'body',
      name: 'Body',
      type: 'Text',
      required: false,
      localized: false,
    },
  ],
};

async function ensureContentType(environment: Environment): Promise<void> {
  console.log('\n📋 Checking for blogPost content type...');

  try {
    const contentType = await environment.getContentType('blogPost');
    console.log('   ✓ Content type "blogPost" already exists');
    return;
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name !== 'NotFound') {
      throw error;
    }
  }

  console.log('   Creating content type "blogPost"...');

  const contentType = await environment.createContentTypeWithId('blogPost', BLOG_POST_CONTENT_TYPE);
  await contentType.publish();

  console.log('   ✓ Content type "blogPost" created and published');
}

async function createPosts(environment: Environment): Promise<void> {
  console.log('\n📝 Creating demo blog posts...\n');

  // Get existing entries to avoid duplicates
  const existingEntries = await environment.getEntries({
    content_type: 'blogPost',
    limit: 100,
  });

  const existingSlugs = new Set(existingEntries.items.map((entry) => entry.fields.slug?.['en-US']));

  let created = 0;
  let skipped = 0;

  for (const post of DEMO_POSTS) {
    if (existingSlugs.has(post.slug)) {
      console.log(`   ⏭  "${post.title}" - already exists, skipping`);
      skipped++;
      continue;
    }

    try {
      const entry = await environment.createEntry('blogPost', {
        fields: {
          title: { 'en-US': post.title },
          slug: { 'en-US': post.slug },
          excerpt: { 'en-US': post.excerpt },
          body: { 'en-US': post.body },
        },
      });

      await entry.publish();
      console.log(`   ✓ Created and published "${post.title}"`);
      created++;
    } catch (error) {
      console.error(`   ✗ Failed to create "${post.title}":`, error);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         CONTENTFUL CONTENT SEEDER');
  console.log('═══════════════════════════════════════════════════════════');

  // Validate environment variables
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

  if (!spaceId || !managementToken) {
    console.error('\n❌ Missing required environment variables:');
    if (!spaceId) console.error('   - CONTENTFUL_SPACE_ID');
    if (!managementToken) console.error('   - CONTENTFUL_MANAGEMENT_TOKEN');
    console.error('\nSet these variables and try again.');
    process.exit(1);
  }

  console.log(`\n🔗 Connecting to Contentful space: ${spaceId}`);

  // Initialize Contentful Management client
  const client = createClient({
    accessToken: managementToken,
  });

  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment('master');

  console.log('   ✓ Connected to environment: master');

  // Ensure content type exists
  await ensureContentType(environment);

  // Create blog posts
  await createPosts(environment);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ✅ Content seeding complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
});
