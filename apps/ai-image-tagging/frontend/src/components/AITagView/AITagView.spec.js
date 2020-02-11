import React from 'react';
import { cleanup, render, wait, configure, fireEvent } from '@testing-library/react';

import mockProps from '../../test/mockProps';
import { AITagView } from './AITagView';

const sdk = {
  ...mockProps.sdk,
  field: {
    getValue: jest.fn(),
    onValueChanged: jest.fn(),
    setValue: jest.fn(),
  },
  entry: {
    fields: {
      image: {
        getValue: jest.fn(),
        onValueChanged: jest.fn()
      },
      imageTags: {
        getValue: jest.fn(),
        setValue: jest.fn()
      }
    }
  },
  window: {
    startAutoResizer: jest.fn(),
  },
  app: {
    setReady: jest.fn()
  },
  space: {
    getAsset: jest.fn()
  }
};

configure({ testIdAttribute: 'data-test-id' });

function renderComponent(sdk) {
  return render(<AITagView space={sdk.space} entries={sdk.entry.fields} />)
}

describe('AITagView', () => {
  afterEach(() => cleanup());

  it('should disable everything if theres no image', async () => {
    sdk.entry.fields.image.getValue.mockImplementation(() => undefined);

    const { getByTestId } = renderComponent(sdk);
    await wait();
    expect(getByTestId('cf-ui-button').disabled).toBeTruthy();
    expect(getByTestId('cf-ui-controlled-input').disabled).toBeTruthy();
    expect(getByTestId('image-tag').disabled).toBeTruthy();
  })
});
