import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../../../test/mocks';
import ResourceField from './ResourceField';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

jest.mock('hooks/field/useResourceValue', () => () => {
  const value = [
    {
      sys: {
        linkType: 'Shopify:Product',
        type: 'ResourceLink',
        urn: 'gid://shopify/Product/123456',
      },
    },
  ];
  return { value };
});

jest.mock('../SortableResourceList/SortableResourceList', () => () => (
  <div>Mock Sortable Resource List</div>
));

describe('ResourceField component', () => {
  it('mounts', () => {
    render(<ResourceField />);

    expect(screen.getByTestId('cf-ui-button')).toBeInTheDocument();
  });
});
