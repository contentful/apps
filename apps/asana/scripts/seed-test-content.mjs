import contentful from 'contentful-management';

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || '5fxpz5980ld6';
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';
const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;
const DEFAULT_LOCALE = 'en-US';

if (!ACCESS_TOKEN) {
  throw new Error('Missing CONTENTFUL_ACCESS_TOKEN');
}

const client = contentful.createClient({
  accessToken: ACCESS_TOKEN,
});

const symbolField = (id, name, options = {}) => ({
  id,
  name,
  type: 'Symbol',
  required: false,
  localized: false,
  omitted: false,
  disabled: false,
  ...options,
});

const textField = (id, name, options = {}) => ({
  id,
  name,
  type: 'Text',
  required: false,
  localized: false,
  omitted: false,
  disabled: false,
  ...options,
});

const dateField = (id, name, options = {}) => ({
  id,
  name,
  type: 'Date',
  required: false,
  localized: false,
  omitted: false,
  disabled: false,
  ...options,
});

const objectField = (id, name, options = {}) => ({
  id,
  name,
  type: 'Object',
  required: false,
  localized: false,
  omitted: false,
  disabled: false,
  ...options,
});

const inValidation = (values) => [{ in: values }];

const contentModels = [
  {
    id: 'asanaTaskRequest',
    name: 'Asana Task Request',
    description:
      'General smoke-test model for validating manual Contentful to Asana task creation and linking flows.',
    displayField: 'title',
    fields: [
      symbolField('title', 'Title', { required: true }),
      symbolField('taskName', 'Task name', { required: true }),
      textField('taskNotes', 'Task notes'),
      symbolField('status', 'Status', {
        required: true,
        validations: inValidation(['Draft', 'Ready for Asana', 'Sent to Asana']),
      }),
      symbolField('owner', 'Owner'),
      symbolField('sourceEntryUrl', 'Source entry URL'),
      objectField('asanaTaskLink', 'Primary Asana Task'),
    ],
    entries: [
      {
        title: 'Homepage hero refresh request',
        taskName: 'Refresh homepage hero for May campaign',
        taskNotes:
          'Create an Asana task from this entry.\n\nRequested updates:\n- Replace headline with seasonal campaign copy\n- Swap CTA to "Explore the release"\n- Confirm final copy with marketing before publishing',
        status: 'Ready for Asana',
        owner: 'Zachary Yankiver',
        publish: true,
      },
      {
        title: 'Long-form testing for Asana notes',
        taskName: 'Validate long notes mapping from Contentful',
        taskNotes:
          'This entry is meant to test larger note bodies.\n\nAcceptance criteria:\n- Preserve blank lines\n- Preserve bullet points\n- Keep punctuation and quotes intact\n\nExample copy:\n"Contentful should hand this off cleanly to Asana."',
        status: 'Ready for Asana',
        owner: 'Zachary Yankiver',
        publish: true,
      },
      {
        title: 'Special characters and duplicate-run test',
        taskName: 'QA: symbols / punctuation / duplicates',
        taskNotes:
          'Use this entry to test task names with special characters and repeated automation runs.\n\nCharacters to preserve: #, :, /, &, ?',
        status: 'Draft',
        owner: 'Zachary Yankiver',
        publish: false,
      },
    ],
  },
  {
    id: 'campaignIntake',
    name: 'Campaign Intake',
    description:
      'Represents campaign intake requests created from Asana forms and expanded into downstream content production work.',
    displayField: 'title',
    fields: [
      symbolField('title', 'Campaign name', { required: true }),
      textField('objective', 'Objective', { required: true }),
      textField('targetAudience', 'Target audience'),
      textField('channels', 'Channels'),
      textField('deliverables', 'Deliverables'),
      symbolField('workflowStage', 'Workflow stage', {
        required: true,
        validations: inValidation([
          'Intake',
          'Briefing',
          'In Progress',
          'Ready for Review',
          'Live',
        ]),
      }),
      dateField('plannedPublishDate', 'Planned publish date'),
      symbolField('campaignOwner', 'Campaign owner'),
      objectField('asanaTaskLink', 'Primary Asana Task'),
    ],
    entries: [
      {
        title: 'Spring Launch 2026 Campaign',
        objective:
          'Drive awareness and qualified pipeline for the Spring Launch release across web, email, and paid social.',
        targetAudience:
          'Mid-market SaaS buyers, existing customers exploring AI-powered content operations, and solution engineers.',
        channels: 'Landing page\nLifecycle email\nLinkedIn paid social\nCustomer webinar',
        deliverables:
          'Launch landing page\nEmail announcement\nPaid social copy set\nWebinar registration page',
        workflowStage: 'Briefing',
        plannedPublishDate: '2026-05-15T09:00:00.000Z',
        campaignOwner: 'Zachary Yankiver',
        publish: false,
      },
      {
        title: 'Customer Stories Q3 Content Sprint',
        objective:
          'Collect and publish three new customer stories aligned to priority industries for Q3 pipeline acceleration.',
        targetAudience: 'Enterprise marketing leaders in retail, fintech, and travel.',
        channels: 'Website customer stories hub\nSales enablement email\nOrganic social',
        deliverables:
          '3 customer story landing pages\n1 roundup email\n3 teaser social posts',
        workflowStage: 'In Progress',
        plannedPublishDate: '2026-07-08T09:00:00.000Z',
        campaignOwner: 'Marketing Operations',
        publish: false,
      },
    ],
  },
  {
    id: 'editorialBlogPost',
    name: 'Editorial Blog Post',
    description:
      'Represents editorial planning and publishing workflows where Asana tracks the calendar and Contentful stores the article.',
    displayField: 'title',
    fields: [
      symbolField('title', 'Title', { required: true }),
      symbolField('slug', 'Slug', { required: true }),
      textField('brief', 'Brief'),
      symbolField('editorialStage', 'Editorial stage', {
        required: true,
        validations: inValidation([
          'Backlog',
          'In Progress',
          'Ready for Review',
          'Scheduled',
          'Published',
        ]),
      }),
      dateField('publishDate', 'Publish date'),
      symbolField('primaryAuthor', 'Primary author'),
      symbolField('contentOwner', 'Content owner'),
      symbolField('publishedUrl', 'Published URL'),
      objectField('asanaTaskLink', 'Primary Asana Task'),
    ],
    entries: [
      {
        title: 'How AI Search Is Changing Content Operations',
        slug: 'ai-search-content-operations',
        brief:
          'Thought leadership post on how AI-native discovery changes content modeling, governance, and editorial operations.',
        editorialStage: 'In Progress',
        publishDate: '2026-04-28T08:00:00.000Z',
        primaryAuthor: 'Taylor Mason',
        contentOwner: 'Editorial Team',
        publish: false,
      },
      {
        title: 'Spring Release Recap: What Marketers Should Use First',
        slug: 'spring-release-recap-marketers',
        brief:
          'Post-publish recap article tied to the product release campaign, optimized for the editorial calendar scheduled/published flow.',
        editorialStage: 'Published',
        publishDate: '2026-04-01T08:00:00.000Z',
        primaryAuthor: 'Avery Chen',
        contentOwner: 'Editorial Team',
        publishedUrl: 'https://www.contentful.com/blog/spring-release-recap-marketers/',
        publish: true,
      },
    ],
  },
  {
    id: 'localizedCampaignEntry',
    name: 'Localized Campaign Entry',
    description:
      'Represents locale-specific campaign variants linked to parent Asana tasks or locale subtasks for translation and rollout tracking.',
    displayField: 'title',
    fields: [
      symbolField('title', 'Title', { required: true }),
      symbolField('campaignName', 'Campaign name', { required: true }),
      symbolField('localeCode', 'Locale', {
        required: true,
        validations: inValidation(['en-US', 'de-DE', 'fr-FR']),
      }),
      symbolField('sourceLocale', 'Source locale'),
      symbolField('localizationStage', 'Localization stage', {
        required: true,
        validations: inValidation([
          'Draft',
          'In Translation',
          'In Review',
          'Ready to Publish',
          'Published',
        ]),
      }),
      symbolField('localeOwner', 'Locale owner'),
      dateField('localizedPublishDate', 'Localized publish date'),
      objectField('asanaTaskLink', 'Primary Asana Task'),
    ],
    entries: [
      {
        title: 'Spring Launch landing page (en-US)',
        campaignName: 'Spring Launch 2026 Campaign',
        localeCode: 'en-US',
        sourceLocale: 'en-US',
        localizationStage: 'Published',
        localeOwner: 'US Web Team',
        localizedPublishDate: '2026-05-15T09:00:00.000Z',
        publish: true,
      },
      {
        title: 'Spring Launch landing page (de-DE)',
        campaignName: 'Spring Launch 2026 Campaign',
        localeCode: 'de-DE',
        sourceLocale: 'en-US',
        localizationStage: 'In Review',
        localeOwner: 'DACH Marketing',
        localizedPublishDate: '2026-05-20T09:00:00.000Z',
        publish: false,
      },
      {
        title: 'Spring Launch landing page (fr-FR)',
        campaignName: 'Spring Launch 2026 Campaign',
        localeCode: 'fr-FR',
        sourceLocale: 'en-US',
        localizationStage: 'In Translation',
        localeOwner: 'France Marketing',
        localizedPublishDate: '2026-05-21T09:00:00.000Z',
        publish: false,
      },
    ],
  },
  {
    id: 'reviewableLandingPage',
    name: 'Reviewable Landing Page',
    description:
      'Represents pages that require legal and brand review coordination with Asana review subtasks and publish readiness tracking.',
    displayField: 'title',
    fields: [
      symbolField('title', 'Title', { required: true }),
      symbolField('contentStatus', 'Content status', {
        required: true,
        validations: inValidation([
          'Draft',
          'In Review',
          'Ready to Publish',
          'Published',
          'Rolled Back',
        ]),
      }),
      symbolField('legalReviewStatus', 'Legal review status', {
        required: true,
        validations: inValidation([
          'Not Started',
          'In Progress',
          'Approved',
          'Changes Requested',
        ]),
      }),
      symbolField('brandReviewStatus', 'Brand review status', {
        required: true,
        validations: inValidation([
          'Not Started',
          'In Progress',
          'Approved',
          'Changes Requested',
        ]),
      }),
      textField('rollbackReason', 'Rollback reason'),
      symbolField('pageOwner', 'Page owner'),
      dateField('plannedPublishDate', 'Planned publish date'),
      objectField('asanaTaskLink', 'Primary Asana Task'),
    ],
    entries: [
      {
        title: 'Spring Launch pricing overview page',
        contentStatus: 'In Review',
        legalReviewStatus: 'Approved',
        brandReviewStatus: 'In Progress',
        pageOwner: 'Launch Web Team',
        plannedPublishDate: '2026-05-14T08:00:00.000Z',
        publish: false,
      },
      {
        title: 'Partner co-marketing landing page',
        contentStatus: 'Rolled Back',
        legalReviewStatus: 'Changes Requested',
        brandReviewStatus: 'Approved',
        rollbackReason:
          'Rolled back after partner legal requested updated claims language for the hero section.',
        pageOwner: 'Partner Marketing',
        plannedPublishDate: '2026-04-24T08:00:00.000Z',
        publish: false,
      },
    ],
  },
];

function localizeEntryFields(entry) {
  return Object.fromEntries(
    Object.entries(entry)
      .filter(([key, value]) => key !== 'publish' && value !== undefined)
      .map(([key, value]) => [key, { [DEFAULT_LOCALE]: value }])
  );
}

async function upsertContentType(environment, model) {
  try {
    const existing = await environment.getContentType(model.id);
    const desiredFieldIds = new Set(model.fields.map((field) => field.id));
    const fieldsToOmit = existing.fields.filter((field) => !desiredFieldIds.has(field.id));

    if (fieldsToOmit.length) {
      existing.fields = existing.fields.map((field) =>
        desiredFieldIds.has(field.id) ? field : { ...field, omitted: true }
      );
      const omitted = await existing.update();
      await omitted.publish();
    }

    const refreshed = await environment.getContentType(model.id);
    refreshed.name = model.name;
    refreshed.description = model.description;
    refreshed.displayField = model.displayField;
    refreshed.fields = model.fields;
    const updated = await refreshed.update();
    await updated.publish();
    return updated;
  } catch (error) {
    if (error?.name !== 'NotFound') {
      throw error;
    }

    const created = await environment.createContentTypeWithId(model.id, {
      sys: { id: model.id },
      name: model.name,
      description: model.description,
      displayField: model.displayField,
      fields: model.fields,
    });
    await created.publish();
    return created;
  }
}

async function createEntries(environment, model) {
  const createdEntries = [];

  for (const entryDefinition of model.entries) {
    const entry = await environment.createEntry(model.id, {
      fields: localizeEntryFields(entryDefinition),
    });

    const maybePublished = entryDefinition.publish ? await entry.publish() : entry;
    createdEntries.push({
      id: maybePublished.sys.id,
      title: entryDefinition.title,
      published: Boolean(entryDefinition.publish),
      url: `https://app.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${maybePublished.sys.id}`,
    });
  }

  return createdEntries;
}

async function main() {
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);
  const results = [];

  for (const model of contentModels) {
    const contentType = await upsertContentType(environment, model);
    const entries = await createEntries(environment, model);

    results.push({
      contentTypeId: contentType.sys.id,
      contentTypeName: model.name,
      entryCount: entries.length,
      entries,
    });
  }

  console.log(
    JSON.stringify(
      {
        spaceId: SPACE_ID,
        environmentId: ENVIRONMENT_ID,
        contentTypesSeeded: results.length,
        results,
      },
      null,
      2
    )
  );
}

await main();
