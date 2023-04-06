import { render, screen } from '@testing-library/react';
import { config } from 'config';
import { useContext } from 'react';
import { mockSdk } from '../../test/mocks';
import { mockSegmentAnalytics } from '../../test/mocks/mockSegmentAnalytics';
import { SegmentAnalyticsContext, SegmentAnalyticsProvider } from './SegmentAnalyticsProvider';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

jest.mock('@segment/analytics-next', () => ({ AnalyticsBrowser: mockSegmentAnalytics }));

describe('SegmentAnalyticsProvider', () => {
  const TestComponent = () => {
    const { segmentAnalytics } = useContext(SegmentAnalyticsContext);
    segmentAnalytics?.track('foo');

    return <div>children</div>;
  };

  it('provides a segmentAnalytics browser to its children', () => {
    jest.spyOn(mockSegmentAnalytics, 'load');

    render(
      <SegmentAnalyticsProvider>
        <TestComponent />
      </SegmentAnalyticsProvider>
    );

    expect(screen.getByText('children')).toBeVisible();
    expect(mockSegmentAnalytics.load).toHaveBeenCalledWith({ writeKey: config.segmentWriteKey });
    expect(mockSegmentAnalytics.identify).toHaveBeenCalledWith(mockSdk.ids.user);
    expect(mockSegmentAnalytics.track).toHaveBeenCalledWith('foo');
  });
});
