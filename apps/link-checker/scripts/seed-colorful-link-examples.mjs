import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const spaceId = process.argv[2];
const environmentId = process.argv[3] || 'master';

if (!spaceId) {
  console.error('Usage: node scripts/seed-colorful-link-examples.mjs <spaceId> [environmentId]');
  process.exit(1);
}

const configPath = path.join(os.homedir(), '.contentfulrc.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
const managementToken = config.managementToken;

if (!managementToken) {
  console.error('No management token found in ~/.contentfulrc.json');
  process.exit(1);
}

const baseUrl = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}`;

async function request(urlPath, options = {}) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getDefaultLocale() {
  const locales = await request('/locales');
  const defaultLocale = locales.items.find((locale) => locale.default);

  if (!defaultLocale) {
    throw new Error('No default locale found in the target environment.');
  }

  return defaultLocale.code;
}

async function getContentType(id) {
  try {
    return await request(`/content_types/${id}`);
  } catch (error) {
    if (String(error).includes('404')) return null;
    throw error;
  }
}

async function getEntry(id) {
  try {
    return await request(`/entries/${id}`);
  } catch (error) {
    if (String(error).includes('404')) return null;
    throw error;
  }
}

async function upsertEntry(id, contentTypeId, fields) {
  const existing = await getEntry(id);
  const headers = {
    'X-Contentful-Content-Type': contentTypeId,
  };

  if (existing) {
    headers['X-Contentful-Version'] = String(existing.sys.version);
  }

  const entry = await request(`/entries/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ fields }),
  });

  return request(`/entries/${id}/published`, {
    method: 'PUT',
    headers: {
      'X-Contentful-Version': String(entry.sys.version),
    },
  });
}

function richTextDocument(...links) {
  return {
    nodeType: 'document',
    data: {},
    content: links.map(({ intro, text, uri }) => ({
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: `${intro} `, marks: [], data: {} },
        {
          nodeType: 'hyperlink',
          data: { uri },
          content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
        },
      ],
    })),
  };
}

const defaultLocale = await getDefaultLocale();

const newsletterType = await getContentType('newsletter');
const homebaseType = await getContentType('HOMEBASE');

if (!newsletterType) {
  throw new Error('Expected content type "newsletter" to exist in the target space.');
}

if (!homebaseType) {
  throw new Error('Expected content type "HOMEBASE" to exist in the target space.');
}

await upsertEntry('link-checker-colorful-newsletter-launch', 'newsletter', {
  title: { [defaultLocale]: 'Platform launch newsletter' },
  status: { [defaultLocale]: 'Draft' },
  sender: { [defaultLocale]: 'Platform Editorial Team' },
  replyToEmail: { [defaultLocale]: 'hello@contentful.com' },
  subjectLine: { [defaultLocale]: 'Explore the new platform launch experience' },
  teaser: {
    [defaultLocale]:
      'A realistic newsletter example with a mix of production, relative, and intentionally questionable links.',
  },
  slug: { [defaultLocale]: 'platform-launch-newsletter' },
  content: {
    [defaultLocale]: richTextDocument(
      {
        intro: 'Read the launch story on',
        text: 'https://www.contentful.com/launch',
        uri: 'https://www.contentful.com/launch',
      },
      {
        intro: 'Review pricing updates at',
        text: 'https://www.contentful.com/pricing',
        uri: 'https://www.contentful.com/pricing',
      },
      {
        intro: 'Support editors can also verify',
        text: '/support/contact',
        uri: '/support/contact',
      },
      {
        intro: 'This legacy staging link should be reviewed:',
        text: 'https://preview.example.com/launch',
        uri: 'https://preview.example.com/launch',
      }
    ),
  },
});

await upsertEntry('link-checker-colorful-newsletter-guides', 'newsletter', {
  title: { [defaultLocale]: 'Platform guides newsletter' },
  status: { [defaultLocale]: 'Draft' },
  sender: { [defaultLocale]: 'Platform Education Team' },
  replyToEmail: { [defaultLocale]: 'guides@contentful.com' },
  subjectLine: { [defaultLocale]: 'Your weekly platform guides and resources' },
  teaser: {
    [defaultLocale]:
      'Another newsletter with several production URLs plus a relative path for base-domain testing.',
  },
  slug: { [defaultLocale]: 'platform-guides-newsletter' },
  content: {
    [defaultLocale]: richTextDocument(
      {
        intro: 'Start with the documentation hub:',
        text: 'https://www.contentful.com/developers/docs/',
        uri: 'https://www.contentful.com/developers/docs/',
      },
      {
        intro: 'Compare plans here:',
        text: 'https://www.contentful.com/platform',
        uri: 'https://www.contentful.com/platform',
      },
      {
        intro: 'Account questions should route to',
        text: '/account/billing',
        uri: '/account/billing',
      },
      {
        intro: 'An intentionally broken example is',
        text: 'https://httpstat.us/404?source=platform-guides',
        uri: 'https://httpstat.us/404?source=platform-guides',
      }
    ),
  },
});

await upsertEntry('link-checker-colorful-homebase-links', 'HOMEBASE', {
  title: { [defaultLocale]: 'Platform editorial link checklist' },
  markdown: {
    [defaultLocale]: `# Colorful editorial checklist

Use these sample links to validate the Link Checker page app against realistic editorial content.

- Production homepage: https://www.contentful.com
- Product launch page: https://www.contentful.com/platform
- Customer stories: https://www.contentful.com/customers
- Relative help center path: /help-center/getting-started
- Relative pricing path: /pricing/teams
- Preview example to flag: https://preview.example.com/campaigns/spring
- Broken example to test: https://httpstat.us/404?source=platform-homebase
`,
  },
});

console.log(
  JSON.stringify(
    {
      spaceId,
      environmentId,
      defaultLocale,
      contentTypes: ['newsletter', 'HOMEBASE'],
      entries: [
        'link-checker-colorful-newsletter-launch',
        'link-checker-colorful-newsletter-guides',
        'link-checker-colorful-homebase-links',
      ],
    },
    null,
    2
  )
);
