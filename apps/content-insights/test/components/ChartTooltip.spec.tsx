import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChartTooltip, TooltipPayloadItem } from '../../src/components/ChartTooltip';
import type { ChartDataPoint } from '../../src/utils/types';

vi.mock('@contentful/f36-components', () => ({
  Box: ({ children, ...props }: any) => (
    <div data-testid="box" {...props}>
      {children}
    </div>
  ),
  Flex: ({ children, ...props }: any) => (
    <div data-testid="flex" {...props}>
      {children}
    </div>
  ),
  Text: ({ children, ...props }: any) => (
    <span data-testid="text" {...props}>
      {children}
    </span>
  ),
}));

describe('ChartTooltip', () => {
  const mockTooltipItems: TooltipPayloadItem[] = [
    { value: 10, name: 'Blog Post', dataKey: 'blogPost', color: '#4A90E2' },
    { value: 5, name: 'Article', dataKey: 'article', color: '#50C878' },
  ];

  const mockNewEntriesData: ChartDataPoint[] = [
    {
      date: 'Dec 2024',
      'New Content': 10,
      avgTimeToPublish: 5.5,
      newContentChange: 25.0,
      avgTimeToPublishChange: -10.0,
    },
    {
      date: 'Jan 2025',
      'New Content': 15,
      avgTimeToPublish: 4.0,
      newContentChange: 50.0,
      avgTimeToPublishChange: -27.3,
    },
  ];

  describe('DefaultTooltip (content type chart)', () => {
    it('renders tooltip with content type names when processedContentTypes is provided', () => {
      const processedContentTypes = new Map([
        ['blogPost', 'Blog Post'],
        ['article', 'Article'],
      ]);

      render(
        <ChartTooltip
          active={true}
          payload={mockTooltipItems}
          label="Dec 2024"
          processedContentTypes={processedContentTypes}
        />
      );

      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
      expect(screen.getByText('Blog Post: 10')).toBeInTheDocument();
      expect(screen.getByText('Article: 5')).toBeInTheDocument();
    });

    it('returns null when active is false', () => {
      const { container } = render(
        <ChartTooltip active={false} payload={mockTooltipItems} label="Dec 2024" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when payload is empty', () => {
      const { container } = render(<ChartTooltip active={true} payload={[]} label="Dec 2024" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('NewEntriesTooltip', () => {
    it('renders new entries tooltip with all metrics when data is available', () => {
      render(
        <ChartTooltip
          active={true}
          label="Dec 2024"
          data={mockNewEntriesData}
          valueKey="New Content"
          inNewEntriesTab={true}
        />
      );

      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
      expect(screen.getByText('10 new entries')).toBeInTheDocument();
      expect(screen.getByText('+25.0% from previous month')).toBeInTheDocument();
      expect(screen.getByText('5.5 days')).toBeInTheDocument();
      expect(screen.getByText('Average time to publish')).toBeInTheDocument();
      expect(screen.getByText('-10.0% from previous month')).toBeInTheDocument();
    });

    it('hides percentage changes when they are undefined', () => {
      const dataWithoutChanges: ChartDataPoint[] = [
        {
          date: 'Dec 2024',
          'New Content': 10,
          avgTimeToPublish: 5.5,
        },
      ];

      render(
        <ChartTooltip
          active={true}
          label="Dec 2024"
          data={dataWithoutChanges}
          valueKey="New Content"
          inNewEntriesTab={true}
        />
      );

      expect(screen.getByText('10 new entries')).toBeInTheDocument();
      expect(screen.queryByText(/from previous month/)).not.toBeInTheDocument();
    });

    it('returns null when active is false', () => {
      const { container } = render(
        <ChartTooltip
          active={false}
          label="Dec 2024"
          data={mockNewEntriesData}
          valueKey="New Content"
          inNewEntriesTab={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null when label is missing', () => {
      const { container } = render(
        <ChartTooltip
          active={true}
          data={mockNewEntriesData}
          valueKey="New Content"
          inNewEntriesTab={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
