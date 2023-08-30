import type { Meta, StoryObj } from '@storybook/react';
import { columns } from '../../__mocks__/products';
import { MetaDataRenderer } from './MetaDataRenderer';
import { Box, Caption, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

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

const styles = {
  textLink: css({
    fontSize: tokens.fontSizeS,
    verticalAlign: 'inherit',
  }),
};

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
            Missing something? <TextLink className={styles.textLink}>Let us know</TextLink>
          </Caption>
        </Box>
      );
    },
  },
};
