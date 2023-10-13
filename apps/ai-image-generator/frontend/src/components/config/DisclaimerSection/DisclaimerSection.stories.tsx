import type { Meta, StoryObj } from '@storybook/react';

import DisclaimerSection from './DisclaimerSection';

const meta = {
  title: 'config/DisclaimerSection',
  component: DisclaimerSection,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DisclaimerSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
