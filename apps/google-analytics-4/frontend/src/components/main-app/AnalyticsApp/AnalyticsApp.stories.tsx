import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import AnalyticsApp from './AnalyticsApp';

const mockSlugName = 'my-page';
const mockViewUrl = 'https://contentful.com';

export default {
  title: 'Analytics/Google Analytics 4/Components/AnalyticsApp',
  component: AnalyticsApp,
} as ComponentMeta<typeof AnalyticsApp>;

const Template: ComponentStory<typeof AnalyticsApp> = (args) => <AnalyticsApp />;
export const Primary = Template.bind({});
