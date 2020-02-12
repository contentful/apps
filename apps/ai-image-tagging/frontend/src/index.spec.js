import React from 'react';
import { App } from './index';
import { render, cleanup, configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id'
});

function renderComponent(sdk) {
  return render(<App sdk={sdk} />);
}

const sdk = {
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
  notifier: {
    error: jest.fn()
  },
  window: {
    startAutoResizer: jest.fn(),
  },
  app: {
    setReady: jest.fn()
  },
  locales: {
    default: 'en-US'
  },
  space: {
    getAsset: jest.fn()
  }
};

describe('App', () => {
  beforeEach(jest.resetAllMocks);

  afterEach(cleanup);

  it('should call starstartAutoResizer', () => {
    renderComponent(sdk);
    expect(sdk.window.startAutoResizer).toHaveBeenCalled();
  });

  it('should call sdk ready fn', () => {
    renderComponent(sdk);
    expect(sdk.app.setReady).toHaveBeenCalled();
  });

  describe('#render', () => {
    it('should render the extension field view', () => {
      const { container } = renderComponent(sdk);
      expect(container).toMatchSnapshot();
    });
  });
});
