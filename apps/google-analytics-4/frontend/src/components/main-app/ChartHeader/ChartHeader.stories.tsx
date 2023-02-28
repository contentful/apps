import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import ChartHeader from './ChartHeader';

const mockMetricName = 'pageviews';
const mockMetricValue = '150';

export default {
  title: 'Analytics/Google Analytics 4/Components/ChartHeader',
  component: ChartHeader,
} as ComponentMeta<typeof ChartHeader>;

const Template: ComponentStory<typeof ChartHeader> = (args) => <ChartHeader {...args} />;
export const Primary = Template.bind({});

Primary.args = {
  metricName: mockMetricName,
  metricValue: mockMetricValue,
};
