import { render } from '@testing-library/react';
import { Primary } from './LineChart.stories';
import { Props } from './LineChart';

describe('LineChart component', () => {
  it('mounts', () => {
    render(<Primary {...(Primary.args as Props)} />);

    const chart = document.querySelector('canvas');

    expect(chart).toBeVisible();
    expect(chart).toHaveAccessibleName('Analytics line chart');
  });
});
