import type { Meta, StoryObj } from '@storybook/react';

import GettingStartedSection from './GettingStartedSection';
import { ConfigAppSDK } from '@contentful/app-sdk';

const meta = {
  title: 'config/GettingStartedSection',
  component: GettingStartedSection,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof GettingStartedSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    sdk: {} as ConfigAppSDK,
  },
};
