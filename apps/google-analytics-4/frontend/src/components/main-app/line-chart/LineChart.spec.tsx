import LineChart from './LineChart';
import { render } from '@testing-library/react';

const mockDataValues = [1000, -500, 500, 230];
const mockXAxisLabels = ['January', 'February', 'March', 'April'];
const mockTooltipMetricLabel = 'Page views';

describe('LineChart component', () => {
  it('mounts', () => {
    render(
      <LineChart
        dataValues={mockDataValues}
        xAxisLabels={mockXAxisLabels}
        tooltipMetricLabel={mockTooltipMetricLabel}
      />
    );

    const chart = document.querySelector('canvas');

    expect(chart).toBeVisible();
    expect(chart).toHaveAccessibleName('Analytics line chart');
  });
});
