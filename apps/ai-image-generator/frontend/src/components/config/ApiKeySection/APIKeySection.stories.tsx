import type { Meta, StoryObj } from '@storybook/react';

import ApiKeySection, { Props as ApiKeySectionProps } from './APIKeySection';

const meta: Meta<ApiKeySectionProps> = {
  title: 'config/APIKey',
  component: ApiKeySection,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<ApiKeySectionProps>;

export const Default: Story = {};

export const WithApiKey: Story = {
  args: { apiKey: 'pretend-api-key' },
};
