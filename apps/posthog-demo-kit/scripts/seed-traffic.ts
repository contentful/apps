/**
 * PostHog Traffic Seeder - "Time Machine"
 *
 * Generates 30 days of historical pageview data in PostHog
 * so your charts show realistic traffic instantly.
 *
 * Usage: npm run seed:traffic
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PostHog } from 'posthog-node';
import { createClient } from 'contentful';

// Configuration
const DAYS_TO_SEED = 30;
const MIN_DAILY_VISITORS = 10;
const MAX_DAILY_VISITORS = 50;
// Default to localhost - no real domain needed! PostHog just stores the URL string.
const SITE_URL = process.env.DEMO_SITE_URL || 'http://localhost:3000';

// User agent pool for more realistic data
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
];

// Referrer pool for realistic traffic sources
const REFERRERS = [
  'https://www.google.com/',
  'https://twitter.com/',
  'https://www.linkedin.com/',
  'https://news.ycombinator.com/',
  '',
  '',
  '', // Direct traffic is common
];

// Country data for geographic distribution
const COUNTRIES = [
  { code: 'US', name: 'United States', weight: 40 },
  { code: 'GB', name: 'United Kingdom', weight: 15 },
  { code: 'DE', name: 'Germany', weight: 10 },
  { code: 'CA', name: 'Canada', weight: 8 },
  { code: 'FR', name: 'France', weight: 7 },
  { code: 'AU', name: 'Australia', weight: 5 },
  { code: 'NL', name: 'Netherlands', weight: 5 },
  { code: 'SE', name: 'Sweden', weight: 3 },
  { code: 'JP', name: 'Japan', weight: 4 },
  { code: 'BR', name: 'Brazil', weight: 3 },
];

interface BlogPost {
  slug: string;
  title: string;
}

interface BlogPostFields {
  title: string;
  slug: string;
}

/**
 * Fetch all blog posts from Contentful
 */
async function fetchBlogPosts(): Promise<BlogPost[]> {
  const client = createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
  });

  const response = await client.getEntries<{ contentTypeId: 'blogPost'; fields: BlogPostFields }>({
    content_type: 'blogPost',
    limit: 100,
  });

  return response.items.map((item) => ({
    slug: item.fields.slug,
    title: item.fields.title,
  }));
}

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random item from an array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a weighted random country
 */
function randomCountry(): { code: string; name: string } {
  const totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);
  let random = Math.random() * totalWeight;

  for (const country of COUNTRIES) {
    random -= country.weight;
    if (random <= 0) {
      return { code: country.code, name: country.name };
    }
  }

  return COUNTRIES[0];
}

/**
 * Generate a unique distinct ID for a visitor
 */
function generateDistinctId(): string {
  return `demo_user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a timestamp for a specific day with random hour/minute
 */
function createTimestamp(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(6, 23)); // Active hours
  date.setMinutes(randomInt(0, 59));
  date.setSeconds(randomInt(0, 59));
  return date;
}

/**
 * Format a date for logging
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Main seeding function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         POSTHOG TIME MACHINE - TRAFFIC SEEDER');
  console.log('═══════════════════════════════════════════════════════════');

  // Validate environment variables
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  const missing: string[] = [];
  if (!posthogKey) missing.push('NEXT_PUBLIC_POSTHOG_KEY');
  if (!spaceId) missing.push('CONTENTFUL_SPACE_ID');
  if (!accessToken) missing.push('CONTENTFUL_ACCESS_TOKEN');

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nSet these variables and try again.');
    process.exit(1);
  }

  console.log(`\n🌐 PostHog Host: ${posthogHost}`);
  console.log(`🔗 Demo Site URL: ${SITE_URL}`);
  console.log(`📅 Days to seed: ${DAYS_TO_SEED}`);

  // Initialize PostHog client
  const posthog = new PostHog(posthogKey!, {
    host: posthogHost,
    flushAt: 100, // Batch size
    flushInterval: 1000, // Flush every 1 second
  });

  // Fetch blog posts from Contentful
  console.log('\n📝 Fetching blog posts from Contentful...');

  let posts: BlogPost[];
  try {
    posts = await fetchBlogPosts();
  } catch (error) {
    console.error('❌ Failed to fetch posts from Contentful:', error);
    process.exit(1);
  }

  if (posts.length === 0) {
    console.error('❌ No blog posts found. Run npm run seed:content first.');
    process.exit(1);
  }

  console.log(`   ✓ Found ${posts.length} blog posts\n`);

  // Stats tracking
  let totalEvents = 0;
  const eventsByDay: Record<string, number> = {};

  // Generate traffic for each day
  console.log('🚀 Generating historical traffic...\n');

  for (let daysAgo = DAYS_TO_SEED; daysAgo >= 0; daysAgo--) {
    const date = createTimestamp(daysAgo);
    const dateStr = formatDate(date);
    eventsByDay[dateStr] = 0;

    // Generate traffic for each post
    for (const post of posts) {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const visitorCount = randomInt(MIN_DAILY_VISITORS, MAX_DAILY_VISITORS);

      for (let i = 0; i < visitorCount; i++) {
        const distinctId = generateDistinctId();
        const timestamp = createTimestamp(daysAgo);
        const country = randomCountry();

        // Capture the pageview event with historical timestamp
        posthog.capture({
          distinctId,
          event: '$pageview',
          timestamp,
          properties: {
            $current_url: url,
            $pathname: `/blog/${post.slug}`,
            $host: new URL(SITE_URL).host,
            $referrer: randomChoice(REFERRERS),
            $referring_domain: randomChoice(REFERRERS)
              ? new URL(randomChoice(REFERRERS) || 'https://google.com').host
              : '',
            $browser: randomChoice(['Chrome', 'Safari', 'Firefox', 'Edge']),
            $browser_version: randomInt(100, 120).toString(),
            $os: randomChoice(['Mac OS X', 'Windows', 'iOS', 'Android', 'Linux']),
            $device_type: randomChoice(['Desktop', 'Mobile', 'Tablet']),
            $screen_width: randomChoice([1920, 1440, 1366, 390, 414, 768]),
            $screen_height: randomChoice([1080, 900, 768, 844, 896, 1024]),
            $geoip_country_code: country.code,
            $geoip_country_name: country.name,
            $user_agent: randomChoice(USER_AGENTS),
            // Custom properties for demo
            content_type: 'blogPost',
            post_slug: post.slug,
            post_title: post.title,
          },
        });

        totalEvents++;
        eventsByDay[dateStr]++;

        // Occasionally capture a CTA click (10% of visitors)
        if (Math.random() < 0.1) {
          posthog.capture({
            distinctId,
            event: 'clicked_cta_button',
            timestamp: new Date(timestamp.getTime() + randomInt(30, 300) * 1000),
            properties: {
              $current_url: url,
              page: `/blog/${post.slug}`,
              button_text: 'Sign Up Now',
              post_title: post.title,
            },
          });
          totalEvents++;
        }
      }
    }

    // Log progress
    const progress = Math.round(((DAYS_TO_SEED - daysAgo) / DAYS_TO_SEED) * 100);
    console.log(
      `   [${progress.toString().padStart(3)}%] ${dateStr}: ${eventsByDay[dateStr]} events`
    );
  }

  // Flush remaining events
  console.log('\n⏳ Flushing events to PostHog...');
  await posthog.shutdown();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   ✅ SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n   📊 Total Events: ${totalEvents.toLocaleString()}`);
  console.log(`   📝 Blog Posts: ${posts.length}`);
  console.log(`   📅 Days: ${DAYS_TO_SEED}`);
  console.log(`   🔗 URL Pattern: ${SITE_URL}/blog/{slug}`);
  console.log('\n   Your PostHog charts should now show 30 days of data!');
  console.log('   Events may take a few minutes to appear in PostHog.\n');
}

main().catch((error) => {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
});
