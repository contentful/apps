import React from 'react';
import SortableResourceList from './SortableResourceList';
import { render, screen } from '@testing-library/react';
import { mockSdk, externalResourceLink } from '../../../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

jest.mock('components/App/Field/ResourceCard', () => () => <div>Mock resource card</div>);

const { getByText } = screen;

describe('SortableResourceList component', () => {
  const mockUseContext: jest.SpyInstance = jest.spyOn(React, 'useContext');

  beforeEach(() => {
    mockUseContext.mockReturnValue({
      isMultiple: false,
    });
  });

  it('mounts', () => {
    render(<SortableResourceList resourceArray={[externalResourceLink]} />);

    const showButton = getByText('Mock resource card');

    expect(showButton).toBeVisible();
  });
});
