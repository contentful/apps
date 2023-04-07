import { render } from '@testing-library/react';
import { SegmentAnalyticsProvider } from 'providers/SegmentAnalyticsProvider';
import React from 'react';
import { FunctionComponent } from 'react';
import { mockSdk } from '../../test/mocks';
import { mockSegmentAnalytics } from '../../test/mocks/mockSegmentAnalytics';
import { useSegmentAnalytics } from './useSegmentAnalytics';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

jest.mock('@segment/analytics-next', () => ({
  get AnalyticsBrowser() {
    return mockSegmentAnalytics;
  },
}));

describe('useSegmentAnalytics', () => {
  const testFn = jest.fn((val) => val);
  const renderTestComponent = (componentFn: FunctionComponent) => {
    const TestComponent = componentFn;
    render(
      React.createElement(SegmentAnalyticsProvider, {
        children: React.createElement(TestComponent),
      })
    );
  };

  it('provides an analytics browser instance', () => {
    renderTestComponent(() => {
      const api = useSegmentAnalytics();
      testFn(api);
      return null;
    });
    expect(testFn).toHaveBeenCalledWith(mockSegmentAnalytics);
  });
});
