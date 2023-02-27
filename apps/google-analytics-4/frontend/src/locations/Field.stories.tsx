import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import Field from './Field';

export default {
  title: 'Google Analytics 4/Pages/Field',
  component: Field,
} as ComponentMeta<typeof Field>;

export const Primary: ComponentStory<typeof Field> = () => <Field />;
