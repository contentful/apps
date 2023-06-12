import React from 'react';
import MissingResourceCard from './MissingResourceCard';
import { render, screen } from '@testing-library/react';
import { externalResourceLink } from '../../../../../../test/mocks';

const ERR_MSG = 'something went wrong';

jest.mock('../ResourceCardMenu/ResourceCardMenu', () => () => <div>Mock resource card menu</div>);

jest.mock('helpers/resourceProviderUtils', () => ({
  getResourceProviderAndType: () => ({
    resourceType: 'product',
    resourceProvider: 'shopify',
  }),
}));

const { getByText, getByTestId } = screen;

describe('MissingResourceCard component', () => {
  const mockUseContext: jest.SpyInstance = jest.spyOn(React, 'useContext');

  beforeEach(() => {
    mockUseContext.mockReturnValue({
      handleRemove: jest.fn(),
      handleMoveToBottom: jest.fn(),
      handleMoveToTop: jest.fn(),
    });
  });

  it('mounts', () => {
    render(
      <MissingResourceCard
        errorMessage={ERR_MSG}
        value={externalResourceLink}
        isLoading={false}
        errorStatus={404}
        index={1}
        total={2}
      />
    );

    const missingText = getByText('Resource is missing or inaccessible');
    const badge = getByTestId('cf-ui-badge');
    const rawData = getByTestId('cf-collapse');

    expect(missingText).toBeVisible();
    expect(badge).toBeVisible();
    expect(badge).toHaveTextContent(ERR_MSG);
    expect(rawData).toBeInTheDocument();
  });
});
