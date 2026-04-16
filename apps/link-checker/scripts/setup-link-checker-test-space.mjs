import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const spaceId = process.argv[2];
const environmentId = process.argv[3] || 'master';

if (!spaceId) {
  console.error('Usage: node scripts/setup-link-checker-test-space.mjs <spaceId> [environmentId]');
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
    if (String(error).includes('404')) {
      return null;
    }
    throw error;
  }
}

async function upsertContentType(id, payload) {
  const existing = await getContentType(id);
  const headers = {};

  if (existing) {
    headers['X-Contentful-Version'] = String(existing.sys.version);
  }

  const contentType = await request(`/content_types/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  return request(`/content_types/${id}/published`, {
    method: 'PUT',
    headers: {
      'X-Contentful-Version': String(contentType.sys.version),
    },
  });
}

async function getEntry(id) {
  try {
    return await request(`/entries/${id}`);
  } catch (error) {
    if (String(error).includes('404')) {
      return null;
    }
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

function richTextDocument(...urls) {
  return {
    nodeType: 'document',
    data: {},
    content: urls.map(({ text, uri }) => ({
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: `${text}: `, marks: [], data: {} },
        {
          nodeType: 'hyperlink',
          data: { uri },
          content: [{ nodeType: 'text', value: uri, marks: [], data: {} }],
        },
      ],
    })),
  };
}

const defaultLocale = await getDefaultLocale();

await upsertContentType('landingPage', {
  name: 'Landing Page',
  description: 'Marketing-style page content with mixed link surfaces for Link Checker testing.',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false },
    { id: 'slug', name: 'Slug', type: 'Symbol', required: true, localized: false },
    { id: 'summary', name: 'Summary', type: 'Text', required: false, localized: true },
    { id: 'body', name: 'Body', type: 'Text', required: false, localized: true },
    {
      id: 'heroLinks',
      name: 'Hero links',
      type: 'Array',
      required: false,
      localized: true,
      items: { type: 'Symbol' },
    },
    { id: 'content', name: 'Content', type: 'RichText', required: false, localized: true },
  ],
});

await upsertContentType('supportArticle', {
  name: 'Support Article',
  description: 'Editorial help-center content with valid, broken, staging, and relative links.',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false },
    { id: 'slug', name: 'Slug', type: 'Symbol', required: true, localized: false },
    { id: 'excerpt', name: 'Excerpt', type: 'Text', required: false, localized: true },
    { id: 'body', name: 'Body', type: 'Text', required: false, localized: true },
    {
      id: 'relatedLinks',
      name: 'Related links',
      type: 'Array',
      required: false,
      localized: true,
      items: { type: 'Symbol' },
    },
    { id: 'content', name: 'Content', type: 'RichText', required: false, localized: true },
  ],
});

await upsertEntry('link-checker-homepage', 'landingPage', {
  title: { [defaultLocale]: 'Spring launch homepage' },
  slug: { [defaultLocale]: 'spring-launch' },
  summary: {
    [defaultLocale]:
      'Primary CTA points to https://www.contentful.com while QA links still mention https://staging.example.com for review.',
  },
  body: {
    [defaultLocale]:
      'Visit /pricing for current plans, learn more at https://www.contentful.com/platform, and avoid the outdated QA dashboard at https://staging.example.com/launch.',
  },
  heroLinks: {
    [defaultLocale]: [
      'https://www.contentful.com/platform',
      '/contact/sales',
      'https://example.invalid/not-found',
    ],
  },
  content: {
    [defaultLocale]: richTextDocument(
      { text: 'Customer story', uri: 'https://www.contentful.com/customers' },
      { text: 'Broken preview', uri: 'https://example.invalid/preview-link' }
    ),
  },
});

await upsertEntry('link-checker-help-center', 'supportArticle', {
  title: { [defaultLocale]: 'Editors: publishing checklist' },
  slug: { [defaultLocale]: 'publishing-checklist' },
  excerpt: {
    [defaultLocale]:
      'Use this article to verify that support content only references production destinations.',
  },
  body: {
    [defaultLocale]:
      'Helpful docs live at https://www.contentful.com/help. Relative references like /support are common, but links to https://dev.example.com/content should be flagged.',
  },
  relatedLinks: {
    [defaultLocale]: [
      'https://www.contentful.com/help',
      'https://httpstat.us/404',
      '/support/contact',
    ],
  },
  content: {
    [defaultLocale]: richTextDocument(
      { text: 'API docs', uri: 'https://www.contentful.com/developers/docs/' },
      { text: 'Staging article', uri: 'https://staging.example.com/help/article' }
    ),
  },
});

await upsertEntry('link-checker-release-notes', 'supportArticle', {
  title: { [defaultLocale]: 'Release notes roundup' },
  slug: { [defaultLocale]: 'release-notes-roundup' },
  excerpt: {
    [defaultLocale]:
      'A second support article with mixed list and rich text links so Link Checker has multiple entries to scan.',
  },
  body: {
    [defaultLocale]:
      'Reference https://www.contentful.com/changelog for current updates and https://preview.example.com/notes for a link that should fail policy checks.',
  },
  relatedLinks: {
    [defaultLocale]: [
      'https://www.contentful.com/changelog',
      'https://preview.example.com/notes',
      '/releases/archive',
    ],
  },
  content: {
    [defaultLocale]: richTextDocument(
      { text: 'Developer docs', uri: 'https://www.contentful.com/developers/docs/' },
      { text: 'Missing page', uri: 'https://httpstat.us/404?source=link-checker' }
    ),
  },
});

await upsertEntry('link-checker-long-title-example', 'landingPage', {
  title: {
    [defaultLocale]:
      'A very long landing page title designed to test how the Link Checker page table handles unusually wide entry names in the Display name column',
  },
  slug: { [defaultLocale]: 'long-title-example' },
  summary: {
    [defaultLocale]:
      'This entry exists to test the table UI with a very long display name and a small set of links.',
  },
  body: {
    [defaultLocale]:
      'Primary production link: https://www.contentful.com/platform. Also check the relative path /contact/sales for resolution behavior.',
  },
  heroLinks: {
    [defaultLocale]: ['https://www.contentful.com/platform', '/contact/sales'],
  },
  content: {
    [defaultLocale]: richTextDocument({
      text: 'Developer docs',
      uri: 'https://www.contentful.com/developers/docs/',
    }),
  },
});

await upsertEntry('link-checker-relative-links-example', 'supportArticle', {
  title: { [defaultLocale]: 'Relative links validation example' },
  slug: { [defaultLocale]: 'relative-links-validation-example' },
  excerpt: {
    [defaultLocale]:
      'This entry is designed specifically to demonstrate links that need a current domain before they can be validated.',
  },
  body: {
    [defaultLocale]:
      'Review /getting-started, /pricing/contact, and ../team/on-call to see how Link Checker handles relative links when the current domain is missing.',
  },
  relatedLinks: {
    [defaultLocale]: ['/docs', '/developers/docs/', '../legal/privacy'],
  },
  content: {
    [defaultLocale]: richTextDocument(
      { text: 'Support home', uri: '/support' },
      { text: 'Contact sales', uri: '/contact/sales' }
    ),
  },
});

console.log(
  JSON.stringify(
    {
      spaceId,
      environmentId,
      defaultLocale,
      contentTypes: ['landingPage', 'supportArticle'],
      entries: [
        'link-checker-homepage',
        'link-checker-help-center',
        'link-checker-release-notes',
        'link-checker-long-title-example',
        'link-checker-relative-links-example',
      ],
    },
    null,
    2
  )
);
