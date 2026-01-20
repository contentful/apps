import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChartWrapper } from '../../src/components/ChartWrapper';
import { createMockChartData } from '../utils/testHelpers';
import type { ChartDataPoint } from '../../src/utils/types';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children, width, height }: any) => (
      <div data-test-id="responsive-container" data-width={width} data-height={height}>
        {children}
      </div>
    ),
    LineChart: ({ children, data, margin }: any) => (
      <div
        data-test-id="line-chart"
        data-points={data?.length || 0}
        data-margin={JSON.stringify(margin)}>
        {children}
      </div>
    ),
    Line: ({ children, dataKey, stroke, strokeWidth, dot, activeDot, type, ...props }: any) => {
      const dataTestId = props['data-testid'];
      return (
        <div
          data-test-id={dataTestId || `line-${dataKey}`}
          data-key={dataKey}
          data-stroke={stroke}
          data-stroke-width={strokeWidth}
          data-dot-r={dot?.r}
          data-active-dot-r={activeDot?.r}
          data-type={type}>
          {children}
        </div>
      );
    },
    XAxis: ({ dataKey, angle, textAnchor, height }: any) => (
      <div
        data-test-id="x-axis"
        data-key={dataKey}
        data-angle={angle}
        data-text-anchor={textAnchor}
        data-height={height}
      />
    ),
    YAxis: () => <div data-test-id="y-axis" />,
    CartesianGrid: ({ strokeDasharray, stroke }: any) => (
      <div
        data-test-id="cartesian-grid"
        data-stroke-dasharray={strokeDasharray}
        data-stroke={stroke}
      />
    ),
    Tooltip: ({ content }: any) => <div data-test-id="tooltip">{content && 'tooltip-content'}</div>,
    LabelList: ({ position, offset, fontSize }: any) => (
      <div
        data-test-id="label-list"
        data-position={position}
        data-offset={offset}
        data-font-size={fontSize}
      />
    ),
  };
});

describe('ChartWrapper component', () => {
  const mockData: ChartDataPoint[] = createMockChartData(5);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders ResponsiveContainer with correct width and height', () => {
      render(
        <ChartWrapper data={mockData} xAxisDataKey="date" height={500} legendTitle="Content:" />
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-width', '100%');
      expect(container).toHaveAttribute('data-height', '500');
    });

    it('renders correct number of Line components based on linesLegends length', () => {
      render(
        <ChartWrapper
          data={mockData}
          xAxisDataKey="date"
          processedContentTypes={
            new Map([
              ['Article', 'Article'],
              ['Blog Post', 'Blog Post'],
              ['Page', 'Page'],
            ])
          }
          legendTitle="Content Types:"
        />
      );

      expect(screen.getByTestId('line-Article')).toBeInTheDocument();
      expect(screen.getByTestId('line-Blog Post')).toBeInTheDocument();
      expect(screen.getByTestId('line-Page')).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('legend shows all linesLegends items', () => {
      render(<ChartWrapper data={mockData} xAxisDataKey="date" legendTitle="Content Types:" />);

      expect(screen.getByText('New Content')).toBeInTheDocument();
      expect(screen.getByText('Updated Content')).toBeInTheDocument();
      expect(screen.getByText('Deleted Content')).toBeInTheDocument();
    });

    it('legend has correct title text', () => {
      render(<ChartWrapper data={mockData} xAxisDataKey="date" legendTitle="Content Types:" />);

      expect(screen.getByText('Content Types:')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('handles empty data array', () => {
      render(<ChartWrapper data={[]} xAxisDataKey="date" legendTitle="Content:" />);

      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-points', '0');
      expect(screen.getByText('Content:')).toBeInTheDocument();
    });

    it('handles data with multiple data points', () => {
      render(<ChartWrapper data={mockData} xAxisDataKey="date" legendTitle="Content:" />);

      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('data-points', mockData.length.toString());
    });
  });
});
