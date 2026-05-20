import React from 'react';
import { App } from './index';
import { render, cleanup, configure } from '@testing-library/react';
import { vi } from 'vitest';

import mockProps from './test/mockProps';

const sdk = {
  ...mockProps.sdk,
  field: {
    getValue: vi.fn(),
    onValueChanged: vi.fn(),
    setValue: vi.fn(),
    removeValue: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
  },
};

vi.mock('./utils', () => ({
  clamp: (num, min, max) => Math.min(Math.max(num, min), max),
  getField: vi.fn(),
  isCompatibleImageField: () => true,
}));

configure({
  testIdAttribute: 'data-test-id',
});

function renderComponent(sdk) {
  return render(<App sdk={sdk} />);
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it('should read a value from field.getValue() and subscribe for external changes', () => {
    const initialValue = 'x: 0px / y: 0px';
    sdk.field.getValue.mockImplementation(() => initialValue);
    const { getByTestId } = renderComponent(sdk);

    expect(sdk.field.getValue).toHaveBeenCalled();
    expect(sdk.field.onValueChanged).toHaveBeenCalled();
    expect(getByTestId('focal-point').value).toEqual(initialValue);
  });

  it('should call startAutoResizer', () => {
    renderComponent(sdk);
    expect(sdk.window.startAutoResizer).toHaveBeenCalled();
  });

  it('should render aspect ratio previews for the linked image asset', async () => {
    const imageField = {
      locales: ['en-US'],
      getValue: vi.fn(() => ({ sys: { id: 'asset-id' } })),
      onValueChanged: vi.fn(),
    };
    const sdkWithImage = {
      ...sdk,
      entry: {
        fields: {
          image: imageField,
        },
      },
      field: {
        ...sdk.field,
        locale: 'en-US',
        getValue: vi.fn(() => ({ focalPoint: mockProps.focalPoint })),
      },
      space: {
        getAsset: vi.fn(() =>
          Promise.resolve({
            fields: {
              file: {
                'en-US': mockProps.file,
              },
            },
          })
        ),
      },
    };
    const { findByText } = renderComponent(sdkWithImage);

    expect(await findByText('16:9')).toBeDefined();
    expect(await findByText('4:3')).toBeDefined();
    expect(await findByText('1:1')).toBeDefined();
    expect(sdkWithImage.space.getAsset).toHaveBeenCalledWith('asset-id');
  });

  describe('#render', () => {
    it('should render the extension field view', () => {
      const { container } = renderComponent(sdk);
      expect(container).toMatchSnapshot();
    });
  });
});
