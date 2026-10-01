# PostHog Demo Kit

A complete demo environment for showcasing the PostHog Analytics Contentful App. Includes a Next.js blog frontend and a "Time Machine" seeder that generates 30 days of historical traffic data.

## 🎯 What's Included

- **Next.js Frontend**: A beautiful blog that pulls content from Contentful and tracks visitors with PostHog
- **Content Seeder**: Creates 5 demo blog posts in your Contentful space
- **Traffic Seeder**: Generates 30 days of historical pageview data in PostHog

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Contentful Configuration
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_delivery_api_token
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token

# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key
POSTHOG_PROJECT_ID=your_project_id

# Demo Site URL (defaults to localhost - no real domain needed!)
# DEMO_SITE_URL=http://localhost:3000
```

### 3. Seed Content & Traffic

```bash
# Create blog posts in Contentful AND generate 30 days of traffic
npm run seed:all

# Or run them separately:
npm run seed:content   # Create blog posts only
npm run seed:traffic   # Generate traffic only
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the blog.

---

## 📋 Getting Your Credentials

### Contentful

1. **Space ID**: Found in Settings → General Settings
2. **Delivery API Token**: Settings → API Keys → Add API Key
3. **Management Token**: Settings → CMA Tokens → Generate Personal Token

### PostHog

1. **Project API Key**: Project Settings → Project Variables → Project API Key
2. **PostHog Host**: 
   - US Cloud: `https://us.i.posthog.com`
   - EU Cloud: `https://eu.i.posthog.com`

---

## 🔗 URL Pattern Configuration

The traffic seeder generates pageviews with URLs matching this pattern:

```
https://my-demo-site.com/blog/{slug}
```

**Important**: Configure the same pattern in your PostHog Contentful App:

1. Open the PostHog app configuration in Contentful
2. Add a URL mapping:
   - **Content Type ID**: `blogPost`
   - **URL Pattern**: `https://my-demo-site.com/blog/{slug}`

---

## 📊 What the Seeder Creates

### Content (`seed:content`)

Creates 5 blog posts with these slugs:
- `getting-started-with-analytics`
- `understanding-user-behavior`
- `session-replays-complete-guide`
- `feature-flags-for-product-teams`
- `building-data-driven-content`

### Traffic (`seed:traffic`)

For each blog post, generates:
- 30 days of historical data
- 10-50 random visitors per day per post
- Realistic browser/device distribution
- Geographic diversity (US, UK, DE, etc.)
- Referrer sources (Google, Twitter, direct)
- ~10% of visitors trigger a `clicked_cta_button` event

---

## 🧪 Testing Custom Events

The blog post pages include a "Sign Up Now" CTA button that triggers:

```javascript
posthog.capture('clicked_cta_button', {
  page: '/blog/{slug}',
  button_text: 'Sign Up Now',
  post_title: 'Post Title'
});
```

Click it to test custom event tracking for Feature Flags demos.

---

## 📁 Project Structure

```
posthog-demo-kit/
├── app/
│   ├── api/posts/[slug]/route.ts  # API route for fetching posts
│   ├── blog/[slug]/page.tsx       # Dynamic blog post page
│   ├── globals.css                # Styling
│   ├── layout.tsx                 # Root layout with PostHog provider
│   ├── page.tsx                   # Homepage with post list
│   └── providers.tsx              # PostHog initialization
├── lib/
│   └── contentful.ts              # Contentful client
├── scripts/
│   ├── seed-content.ts            # Creates blog posts in Contentful
│   └── seed-traffic.ts            # Generates historical pageviews
├── package.json
└── README.md
```

---

## 🎨 Customization

### Change the Demo Site URL

Update `DEMO_SITE_URL` in your `.env.local` and make sure the PostHog Contentful App has a matching URL pattern.

### Adjust Traffic Volume

Edit `scripts/seed-traffic.ts`:

```typescript
const DAYS_TO_SEED = 30;          // Number of days
const MIN_DAILY_VISITORS = 10;    // Minimum visitors per day per post
const MAX_DAILY_VISITORS = 50;    // Maximum visitors per day per post
```

### Add More Blog Posts

Edit the `DEMO_POSTS` array in `scripts/seed-content.ts`.

---

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed:content` | Create blog posts in Contentful |
| `npm run seed:traffic` | Generate historical PostHog events |
| `npm run seed:all` | Run both seeders |

---

## 📚 Related Resources

- [PostHog Analytics Contentful App](../posthog/README.md)
- [PostHog Documentation](https://posthog.com/docs)
- [Contentful App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/)
