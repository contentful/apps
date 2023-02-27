import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import ChartFooter from './ChartFooter';

const mockSlugName = 'my-page';
const mockViewUrl = 'https://contentful.com';

export default {
  title: 'Analytics/Components/ChartFooter',
  component: ChartFooter,
} as ComponentMeta<typeof ChartFooter>;

const Template: ComponentStory<typeof ChartFooter> = (args) => <ChartFooter {...args} />;
export const Primary = Template.bind({});

Primary.args = {
  slugName: mockSlugName,
  viewUrl: mockViewUrl,
};
