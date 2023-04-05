import { mockSdk } from '../../test/mocks';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { render } from '@testing-library/react';
import React, { FunctionComponent } from 'react';
import { useAnalytics } from './useAnalytics';
import { mockAnalytics } from '../../test/mocks/mockAnalytics';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

jest.mock('@segment/analytics-next', () => ({
  AnalyticsBrowser: mockAnalytics,
}));

const testFn = jest.fn((val) => val);
const renderTestComponent = (componentFn: FunctionComponent) => {
  const TestComponent = componentFn;

  render(React.createElement(TestComponent));
};

describe('useAnalytics', () => {
  it('provides an AnalyticsBrowser instance to children', () => {
    let analytics;
    renderTestComponent(() => {
      analytics = useAnalytics();
      testFn(analytics);
      return null;
    });
    expect(testFn).toHaveBeenCalledWith(analytics);
    expect((analytics as unknown as AnalyticsBrowser).identify).toHaveBeenCalledWith(
      mockSdk.ids.user
    );
  });
});
