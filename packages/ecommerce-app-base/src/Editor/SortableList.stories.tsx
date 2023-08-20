import type { Meta, StoryObj } from '@storybook/react';
import { productsList } from '../__mocks__';
import { SortableList } from './SortableList';
import { GlobalStyles } from '@contentful/f36-components';
import { parameters } from '../../.storybook/parameters';
import { integration } from '../__mocks__/storybook/integration';
import { IntegrationProvider } from './IntegrationContext';
import { Integration } from '../types';

type Args = typeof SortableList & Pick<Integration, 'productCardVersion'>;

const meta: Meta<Args> = {
  component: SortableList,
  tags: ['autodocs'],
  ...parameters,
  argTypes: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    productCardVersion: {
      options: ['v1', 'v2'],
      control: { type: 'radio' },
      defaultValue: 'v1',
    },
  },
};

export default meta;

type Story = StoryObj<typeof SortableList>;

export const Default: Story = {
  args: {
    skuType: 'Product',
    productPreviews: productsList,
    disabled: false,
    deleteFn: () => {},
  },
  render: (args, context) => {
    console.log({ args, context });
    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      <IntegrationProvider integration={integration(args.productCardVersion)}>
        <GlobalStyles />
        <SortableList {...args} />
      </IntegrationProvider>
    );
  },
};
