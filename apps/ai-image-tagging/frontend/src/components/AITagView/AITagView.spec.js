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
        getValue: jest.fn()
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
  }
};

function renderComponent(sdk) {
  return render(<AITagView space={sdk.space} entries={sdk.entry.fields} />)
}

