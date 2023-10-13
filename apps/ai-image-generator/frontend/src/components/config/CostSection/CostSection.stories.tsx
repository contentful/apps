import type { Meta, StoryObj } from '@storybook/react';

import CostSection from './CostSection';

const meta = {
  title: 'config/CostSection',
  component: CostSection,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CostSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
