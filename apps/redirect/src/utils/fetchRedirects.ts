import type { BaseAppSDK } from '@contentful/app-sdk';
import type { Redirect } from '../components/RedirectsTable';

export interface FetchRedirectsResult {
  redirects: Redirect[];
  total: number;
  fetchedAt: Date;
}

export const fetchRedirects = async (_sdk: BaseAppSDK): Promise<FetchRedirectsResult> => {
  const mockRedirects: Redirect[] = [
    {
      id: 'entry-1',
      title: 'Source Title',
      source: {
        sys: { id: 'source-entry-1' },
        fields: {
          id: { value: '1' },
          title: { value: 'Source Title' },
          slug: { value: 'source-slug' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-1' },
        fields: {
          id: { value: '1' },
          title: { value: 'Destination Title' },
          slug: { value: 'destination-slug' },
        },
      },
      reason: 'Reason 1',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'entry-2',
      title: 'Source Title 2',
      source: {
        sys: { id: 'source-entry-2' },
        fields: {
          id: { value: '2' },
          title: { value: 'Source Title 2' },
          slug: { value: 'source-slug-2' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-2' },
        fields: {
          id: { value: '2' },
          title: { value: 'Destination Title 2' },
          slug: { value: 'destination-slug-2' },
        },
      },
      reason: 'Reason 2',
      type: 'Temporary (302)',
      status: 'inactive',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'entry-3',
      title: 'Source Title 3',
      source: {
        sys: { id: 'source-entry-3' },
        fields: {
          id: { value: '3' },
          title: { value: 'Source Title 3' },
          slug: { value: 'source-slug-3' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-3' },
        fields: {
          id: { value: '3' },
          title: { value: 'Destination Title 3' },
          slug: { value: 'destination-slug-3' },
        },
      },
      reason: 'Reason 3',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'entry-4',
      title: 'Source Title 4',
      source: {
        sys: { id: 'source-entry-4' },
        fields: {
          id: { value: '4' },
          title: { value: 'Source Title 4' },
          slug: { value: 'source-slug-4' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-4' },
        fields: {
          id: { value: '4' },
          title: { value: 'Destination Title 4' },
          slug: { value: 'destination-slug-4' },
        },
      },
      reason: 'Reason 4',
      type: 'Temporary (302)',
      status: 'inactive',
      createdAt: '2026-01-04T00:00:00.000Z',
    },
    {
      id: 'entry-5',
      title: 'Source Title 5',
      source: {
        sys: { id: 'source-entry-5' },
        fields: {
          id: { value: '5' },
          title: { value: 'Source Title 5' },
          slug: { value: 'source-slug-5' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-5' },
        fields: {
          id: { value: '5' },
          title: { value: 'Destination Title 5' },
          slug: { value: 'destination-slug-5' },
        },
      },
      reason: 'Reason 5',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'entry-6',
      title: 'Source Title 6',
      source: {
        sys: { id: 'source-entry-6' },
        fields: {
          id: { value: '6' },
          title: { value: 'Source Title 6' },
          slug: { value: 'source-slug-6' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-6' },
        fields: {
          id: { value: '6' },
          title: { value: 'Destination Title 6' },
          slug: { value: 'destination-slug-6' },
        },
      },
      reason: 'Reason 6',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-06T00:00:00.000Z',
    },
    {
      id: 'entry-7',
      title: 'Source Title 7',
      source: {
        sys: { id: 'source-entry-7' },
        fields: {
          id: { value: '7' },
          title: { value: 'Source Title 7' },
          slug: { value: 'source-slug-7' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-7' },
        fields: {
          id: { value: '7' },
          title: { value: 'Destination Title 7' },
          slug: { value: 'destination-slug-7' },
        },
      },
      reason: 'Reason 7',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-07T00:00:00.000Z',
    },
    {
      id: 'entry-8',
      title: 'Source Title 8',
      source: {
        sys: { id: 'source-entry-8' },
        fields: {
          id: { value: '8' },
          title: { value: 'Source Title 8' },
          slug: { value: 'source-slug-8' },
        },
      },
      destination: {
        sys: { id: 'destination-entry-8' },
        fields: {
          id: { value: '8' },
          title: { value: 'Destination Title 8' },
          slug: { value: 'destination-slug-8' },
        },
      },
      reason: 'Reason 8',
      type: 'Permanent (301)',
      status: 'active',
      createdAt: '2026-01-08T00:00:00.000Z',
    },
  ];

  return {
    redirects: mockRedirects,
    total: mockRedirects.length,
    fetchedAt: new Date(),
  };
};
