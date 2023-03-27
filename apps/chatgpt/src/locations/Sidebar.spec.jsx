import React from 'react';
import Sidebar from './Sidebar';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    mockSdk.entry = {
      getSys: () => {
        return {
          id: 'id',
        };
      },
    };
    mockSdk.entry.fields = {
      title: {
        getValue: () => 'value',
      },
    };
    mockSdk.contentType = {};
    mockSdk.contentType.displayField = 'title';
    mockSdk.locales = {
      default: 'en-US',
      available: ['en-US'],
      names: {
        'en-US': 'English (United States)',
      },
    };
  });

  xit('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Please select an option')).toBeInTheDocument();
  });
});
