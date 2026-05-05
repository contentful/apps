import { tool } from 'ai';
import { z } from 'zod';
import { CmaService } from '@services/cmaService';

export function buildTools(service: CmaService, defaultLocale: string) {
  return {
    // ── Space & Environments ────────────────────────────────────────────────
    get_space_info: tool({
      description: 'Get information about the current Contentful space.',
      parameters: z.object({}),
      execute: async () => service.getSpaceInfo(),
    }),

    list_environments: tool({
      description: 'Returns the current environment the app is running in.',
      parameters: z.object({}),
      execute: async () => service.listEnvironments(),
    }),

    // ── Content Types ───────────────────────────────────────────────────────
    list_content_types: tool({
      description:
        'List content types in the space. Returns id, name, description, and field count.',
      parameters: z.object({
        limit: z.number().optional().describe('Max results to return (default 25).'),
        skip: z.number().optional().describe('Offset for pagination.'),
      }),
      execute: async ({ limit, skip }) => service.listContentTypes(limit ?? 25, skip ?? 0),
    }),

    get_content_type: tool({
      description: 'Get full details of a content type including all field definitions.',
      parameters: z.object({
        contentTypeId: z.string().describe('The content type ID.'),
      }),
      execute: async ({ contentTypeId }) => service.getContentType(contentTypeId),
    }),

    create_content_type: tool({
      description:
        'Create a new content type. After creating, call publish_content_type to make it usable.',
      parameters: z.object({
        name: z.string().describe('Display name of the content type.'),
        description: z.string().optional().describe('Optional description.'),
        displayField: z
          .string()
          .optional()
          .describe('Field ID to use as the entry title. Defaults to the first field.'),
        fields: z
          .array(
            z.object({
              id: z.string().describe('Camel-case field ID, e.g. "blogTitle".'),
              name: z.string().describe('Human-readable field label.'),
              type: z
                .enum([
                  'Symbol',
                  'Text',
                  'Integer',
                  'Number',
                  'Date',
                  'Boolean',
                  'Object',
                  'RichText',
                  'Array',
                  'Link',
                ])
                .describe('Contentful field type.'),
              required: z.boolean().optional(),
              localized: z.boolean().optional(),
            })
          )
          .describe('Array of field definitions.'),
      }),
      execute: async (params) => service.createContentType(params),
    }),

    update_content_type: tool({
      description:
        'Update the name, description, or display field of an existing content type.',
      parameters: z.object({
        contentTypeId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        displayField: z.string().optional(),
      }),
      execute: async ({ contentTypeId, ...rest }) =>
        service.updateContentType(contentTypeId, rest),
    }),

    publish_content_type: tool({
      description: 'Publish a content type so it can be used to create entries.',
      parameters: z.object({
        contentTypeId: z.string().describe('The content type ID to publish.'),
      }),
      execute: async ({ contentTypeId }) => service.publishContentType(contentTypeId),
    }),

    // ── Entries ─────────────────────────────────────────────────────────────
    search_entries: tool({
      description:
        'Search and list entries. Can filter by content type and full-text query. Returns id, content type, status, and key field values.',
      parameters: z.object({
        contentTypeId: z
          .string()
          .optional()
          .describe('Filter by content type ID. Omit to search across all types.'),
        query: z.string().optional().describe('Full-text search query.'),
        limit: z.number().optional().describe('Max results (default 10).'),
        skip: z.number().optional().describe('Pagination offset.'),
        order: z
          .string()
          .optional()
          .describe('Sort order, e.g. "-sys.updatedAt" (default) or "sys.createdAt".'),
      }),
      execute: async (params) => service.searchEntries(params),
    }),

    get_entry: tool({
      description: 'Get full details of a specific entry including all field values.',
      parameters: z.object({
        entryId: z.string().describe('The entry ID.'),
      }),
      execute: async ({ entryId }) => service.getEntry(entryId),
    }),

    create_entry: tool({
      description:
        'Create a new entry for a given content type. Provide fields as a plain object — locale wrapping is handled automatically.',
      parameters: z.object({
        contentTypeId: z.string().describe('The content type ID for the new entry.'),
        fields: z
          .record(z.unknown())
          .describe(
            'Entry field values as key-value pairs, e.g. { "title": "My Post", "body": "Hello world" }.'
          ),
      }),
      execute: async ({ contentTypeId, fields }) =>
        service.createEntry(contentTypeId, fields, defaultLocale),
    }),

    update_entry: tool({
      description: 'Update fields on an existing entry. Only the provided fields will be changed.',
      parameters: z.object({
        entryId: z.string(),
        fields: z.record(z.unknown()).describe('Fields to update as key-value pairs.'),
      }),
      execute: async ({ entryId, fields }) =>
        service.updateEntry(entryId, fields, defaultLocale),
    }),

    publish_entry: tool({
      description: 'Publish an entry so it is publicly visible.',
      parameters: z.object({ entryId: z.string() }),
      execute: async ({ entryId }) => service.publishEntry(entryId),
    }),

    unpublish_entry: tool({
      description: 'Unpublish an entry to take it offline without deleting it.',
      parameters: z.object({ entryId: z.string() }),
      execute: async ({ entryId }) => service.unpublishEntry(entryId),
    }),

    delete_entry: tool({
      description:
        'Permanently delete an entry. This cannot be undone — confirm with the user before calling.',
      parameters: z.object({ entryId: z.string() }),
      execute: async ({ entryId }) => service.deleteEntry(entryId),
    }),

    archive_entry: tool({
      description:
        'Archive an entry to hide it from editors without deleting it. Useful for stale or outdated content.',
      parameters: z.object({ entryId: z.string() }),
      execute: async ({ entryId }) => service.archiveEntry(entryId),
    }),

    unarchive_entry: tool({
      description: 'Unarchive a previously archived entry to make it editable again.',
      parameters: z.object({ entryId: z.string() }),
      execute: async ({ entryId }) => service.unarchiveEntry(entryId),
    }),

    update_entry_tags: tool({
      description:
        'Add, remove, or replace metadata tags on an entry. Tags must already exist in the space.',
      parameters: z.object({
        entryId: z.string(),
        action: z
          .enum(['add', 'remove', 'set'])
          .describe(
            '"add" appends tags, "remove" removes specified tags, "set" replaces all tags.'
          ),
        tagIds: z.array(z.string()).describe('Tag IDs to apply.'),
      }),
      execute: async ({ entryId, action, tagIds }) =>
        service.updateEntryTags(entryId, action, tagIds),
    }),

    // ── Releases ────────────────────────────────────────────────────────────
    list_releases: tool({
      description: 'List releases in the current environment.',
      parameters: z.object({
        limit: z.number().optional().describe('Max results (default 25).'),
        skip: z.number().optional().describe('Pagination offset.'),
      }),
      execute: async ({ limit, skip }) => service.listReleases(limit ?? 25, skip ?? 0),
    }),

    create_release: tool({
      description: 'Create a new empty release.',
      parameters: z.object({
        title: z.string().describe('Name of the release.'),
      }),
      execute: async ({ title }) => service.createRelease(title),
    }),

    add_entries_to_release: tool({
      description: 'Add one or more entries to an existing release.',
      parameters: z.object({
        releaseId: z.string().describe('The release ID.'),
        entryIds: z.array(z.string()).describe('Entry IDs to add.'),
      }),
      execute: async ({ releaseId, entryIds }) =>
        service.addEntriesToRelease(releaseId, entryIds),
    }),

    publish_release: tool({
      description: 'Publish all entries in a release at once.',
      parameters: z.object({
        releaseId: z.string().describe('The release ID to publish.'),
      }),
      execute: async ({ releaseId }) => service.publishRelease(releaseId),
    }),

    // ── Assets ──────────────────────────────────────────────────────────────
    list_assets: tool({
      description:
        'List assets in the space. Returns id, title, file type, and last updated date.',
      parameters: z.object({
        limit: z.number().optional().describe('Max results (default 10).'),
        skip: z.number().optional().describe('Pagination offset.'),
      }),
      execute: async ({ limit, skip }) => service.listAssets(limit ?? 10, skip ?? 0),
    }),

    get_asset: tool({
      description: 'Get full details of a specific asset.',
      parameters: z.object({ assetId: z.string().describe('The asset ID.') }),
      execute: async ({ assetId }) => service.getAsset(assetId),
    }),

    // ── Locales & Tags ───────────────────────────────────────────────────────
    list_locales: tool({
      description: 'List all locales configured in the current environment.',
      parameters: z.object({}),
      execute: async () => service.listLocales(),
    }),

    list_tags: tool({
      description: 'List all tags available in the current environment.',
      parameters: z.object({}),
      execute: async () => service.listTags(),
    }),
  };
}
