import type { Meta, StoryObj } from '@storybook/react';
import { ProductImage } from './ProductImage';

const meta: Meta<typeof ProductImage> = {
  component: ProductImage,
  tags: ['autodocs'],
  args: {
    alt: 'Product Image',
  },
};

export default meta;

type Story = StoryObj<typeof ProductImage>;

export const Default: Story = {
  args: {
    src: 'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
  },
};

export const Loading: Story = {};

export const Error: Story = {
  args: {
    src: 'not-resolvable',
  },
};
