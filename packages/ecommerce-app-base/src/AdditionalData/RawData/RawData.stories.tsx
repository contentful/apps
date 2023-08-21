import type { Meta, StoryObj } from '@storybook/react';
import { RawData } from './index';
import { Container } from '../Container';
import { parameters } from '../../../.storybook/parameters';

const meta: Meta<typeof RawData> = {
  title: 'AdditionalData/RawData',
  component: RawData,
  tags: ['autodocs'],
  ...parameters,
};

export default meta;

type Story = StoryObj<typeof RawData>;

export const Default: Story = {
  args: {
    value: { hello: 'world' },
  },
};

export const Wrapped: Story = {
  args: {
    value: { hello: 'world' },
  },
  decorators: [
    (Story) => {
      return (
        <Container>
          <Story />
        </Container>
      );
    },
  ],
};
