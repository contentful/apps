import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import Field from './Field';

export default {
  title: 'Pages/Field',
  component: Field,
} as ComponentMeta<typeof Field>;

export const Primary: ComponentStory<typeof Field> = () => <Field />;
