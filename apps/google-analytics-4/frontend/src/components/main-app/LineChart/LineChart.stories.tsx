import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import LineChart from './LineChart';

export default {
  title: 'Components/Sidebar/LineChart',
  component: LineChart,
  decorators: [
    (Story) => (
      <div style={{ margin: '10em' }}>
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof LineChart>;

const Template: ComponentStory<typeof LineChart> = (args) => <LineChart {...args} />;
export const Primary = Template.bind({});

const mockData = [1000, -500, 500, 230];
const mockLabels = ['January', 'February', 'March', 'April'];

Primary.args = {
  dataValues: mockData,
  xAxisLabels: mockLabels,
};
