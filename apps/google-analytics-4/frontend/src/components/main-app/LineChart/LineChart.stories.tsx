import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import LineChart from './LineChart';

export default {
  title: 'Core/LineChart',
  component: LineChart,
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
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
  tooltipMetricLabel: 'Page views:',
};

Primary.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File',
  },
};
