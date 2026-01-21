import { act, render, RenderOptions } from '@testing-library/react';
import React from 'react';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';
import { ReactElement } from 'react';
import type { ChartDataPoint } from '../../src/utils/types';
import { QueryProvider } from '../../src/providers/QueryProvider';

export interface MockEntryOverrides {
  id?: string;
  createdAt?: string;
  contentTypeId?: string;
  createdById?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export function createMockEntry(overrides: MockEntryOverrides = {}): EntryProps {
  const now = new Date();
  const {
    id = `entry-${Math.random().toString(36).slice(2, 11)}`,
    createdAt = now.toISOString(),
    contentTypeId = 'blogPost',
    createdById = `user-${Math.random().toString(36).slice(2, 11)}`,
    updatedAt = now.toISOString(),
    publishedAt = now.toISOString(),
  } = overrides;

  return {
    sys: {
      id,
      type: 'Entry',
      createdAt,
      updatedAt,
      publishedAt,
      contentType: {
        sys: {
          id: contentTypeId,
          type: 'Link',
          linkType: 'ContentType',
        },
      },
      createdBy: {
        sys: {
          id: createdById,
          type: 'Link',
          linkType: 'User',
        },
      },
      space: {
        sys: {
          id: 'test-space',
          type: 'Link',
          linkType: 'Space',
        },
      },
      environment: {
        sys: {
          id: 'test-environment',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      automationTags: [],
      version: 1,
    },
    fields: {},
  } as EntryProps;
}

export interface MockUserOverrides {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function createMockUser(overrides: MockUserOverrides = {}) {
  const {
    id = `user-${Math.random().toString(36).slice(2, 11)}`,
    firstName,
    lastName,
    email = `user-${id}@example.com`,
  } = overrides;

  return {
    sys: {
      id,
      type: 'User',
    },
    firstName,
    lastName,
    email,
  };
}

export function createMockChartData(count: number = 5): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    data.push({
      date: monthYear,
      'New Content': Math.floor(Math.random() * 20),
    });
  }

  return data;
}

export function createMockContentTypeNames(
  contentTypes: Array<{ id: string; name: string }>
): Map<string, string> {
  const map = new Map<string, string>();
  contentTypes.forEach(({ id, name }) => {
    map.set(id, name);
  });
  return map;
}

export async function renderWithAct(
  ui: ReactElement,
  options?: RenderOptions
): Promise<ReturnType<typeof render>> {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui, options);
  });
  return result!;
}

export interface MockScheduledActionOverrides {
  id?: string;
  entityId?: string;
  entityLinkType?: 'Entry' | 'Release';
  scheduledFor?: string;
  action?: 'publish' | 'unpublish';
  createdById?: string;
}

export function createMockScheduledAction(
  overrides: MockScheduledActionOverrides = {}
): ScheduledActionProps {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const {
    id = `action-${Math.random().toString(36).slice(2, 11)}`,
    entityId = `entity-${Math.random().toString(36).slice(2, 11)}`,
    entityLinkType = 'Entry',
    scheduledFor = futureDate.toISOString(),
    action = 'publish',
    createdById = `user-${Math.random().toString(36).slice(2, 11)}`,
  } = overrides;

  return {
    sys: {
      id,
      type: 'ScheduledAction',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      space: { sys: { id: 'test-space', type: 'Link', linkType: 'Space' } },
      status: 'scheduled',
      createdBy: {
        sys: {
          id: createdById,
          type: 'Link',
          linkType: 'User',
        },
      },
      updatedBy: {
        sys: {
          id: createdById,
          type: 'Link',
          linkType: 'User',
        },
      },
    },
    entity: {
      sys: {
        id: entityId,
        type: 'Link',
        linkType: entityLinkType,
      },
    },
    scheduledFor: {
      datetime: scheduledFor,
      timezone: 'UTC',
    },
    action,
  } as ScheduledActionProps;
}

export interface MockContentTypeOverrides {
  id?: string;
  name?: string;
  displayField?: string;
}

export function createMockContentType(overrides: MockContentTypeOverrides = {}): ContentTypeProps {
  const {
    id = `contentType-${Math.random().toString(36).slice(2, 11)}`,
    name = 'Blog Post',
    displayField = 'title',
  } = overrides;

  return {
    sys: {
      id,
      type: 'ContentType',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      space: { sys: { id: 'test-space', type: 'Link', linkType: 'Space' } },
      environment: { sys: { id: 'test-environment', type: 'Link', linkType: 'Environment' } },
    },
    name,
    displayField,
    fields: [],
  } as unknown as ContentTypeProps;
}

export function createQueryProviderWrapper(): React.ComponentType<{ children: React.ReactNode }> {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryProvider, { children });
  };
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
}
