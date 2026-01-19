import { act, render, RenderOptions } from '@testing-library/react';
import { EntryProps } from 'contentful-management';
import { ReactElement } from 'react';
import type { ChartDataPoint } from '../../src/utils/types';

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
