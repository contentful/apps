import type { Meta, StoryObj } from '@storybook/react';
import { productsList } from '../__mocks__';
import { SortableList } from './SortableList';
import { GlobalStyles } from '@contentful/f36-components';
import { parameters } from '../../.storybook/parameters';
import { integration } from '../__mocks__/storybook/integration';
import { IntegrationProvider } from './IntegrationContext';

const meta: Meta<typeof SortableList> = {
  component: SortableList,
  tags: ['autodocs'],
  ...parameters,
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
  render: (args) => {
    return (
      <IntegrationProvider integration={integration('v2')}>
        <GlobalStyles />
        <SortableList {...args} />
      </IntegrationProvider>
    );
  },
};
