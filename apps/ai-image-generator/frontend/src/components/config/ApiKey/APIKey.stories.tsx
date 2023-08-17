import type { Meta, StoryObj } from '@storybook/react';

import ApiKeySection from './APIKey';

const meta = {
  title: 'config/APIKey',
  component: ApiKeySection,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ApiKeySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
