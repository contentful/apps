import type { Meta, StoryObj } from '@storybook/react';
import { columns } from '../../__mocks__/products';
import { MetaDataRenderer } from './MetaDataRenderer';
import { Box, Caption, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

const meta: Meta<typeof MetaDataRenderer> = {
  title: 'AdditionalData/MetaDataRenderer',
  component: MetaDataRenderer,
  tags: ['autodocs'],
  parameters: {
    layout: 'left',
  },
};

export default meta;

type Story = StoryObj<typeof MetaDataRenderer>;

export const Default: Story = {
  args: {
    columns,
  },
};

export const WithFooter: Story = {
  args: {
    columns,
    footer: () => {
      return (
        <Box marginTop={'spacingXs'}>
          <Caption>
            Missing something?{' '}
            <TextLink
              style={{
                fontSize: tokens.fontSizeS,
                verticalAlign: 'inherit',
              }}>
              Let us know
            </TextLink>
          </Caption>
        </Box>
      );
    },
  },
};
