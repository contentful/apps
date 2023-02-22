import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import LocalhostWarning from './LocalhostWarning';

export default {
  title: 'Components/Common/LocalhostWarning',
  component: LocalhostWarning,
} as ComponentMeta<typeof LocalhostWarning>;

const Template: ComponentStory<typeof LocalhostWarning> = () => <LocalhostWarning />;

export const Primary = Template.bind({});
