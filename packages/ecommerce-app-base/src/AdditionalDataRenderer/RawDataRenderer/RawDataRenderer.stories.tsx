import type { Meta, StoryObj } from '@storybook/react';
import { RawDataRenderer } from './index';
import { decorators } from '../../__mocks__/storybook/decorators';

const meta: Meta<typeof RawDataRenderer> = {
  title: 'AdditionalData/RawDataRenderer',
  component: RawDataRenderer,
  tags: ['autodocs'],
  decorators: [decorators.WithFixedWidth()],
};

export default meta;

type Story = StoryObj<typeof RawDataRenderer>;

export const Default: Story = {
  args: {
    value: { hello: 'world' },
  },
};
