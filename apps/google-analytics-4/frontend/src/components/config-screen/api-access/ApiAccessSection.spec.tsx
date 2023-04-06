import { act, render, screen } from '@testing-library/react';
import ApiAccessSection from './ApiAccessSection';
import { mockSdk, mockCma } from '../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component (not installed)', () => {
  it('can render the about section', () => {
    act(() => {
      render(
        <ApiAccessSection
          isAppInstalled={false}
          onAccountSummariesChange={() => {}}
          parameters={{}}
          mergeSdkParameters={() => {}}
          isInEditMode={false}
          isSavingConfiguration={false}
          onInEditModeChange={() => {}}
          onHasServiceCheckErrorsChange={() => {}}
          onKeyFileUpdate={() => {}}
          onIsApiAccessLoading={() => {}}
        />
      );
    });

    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
    expect(screen.getByText('Service Account Key')).toBeInTheDocument();
  });
});
