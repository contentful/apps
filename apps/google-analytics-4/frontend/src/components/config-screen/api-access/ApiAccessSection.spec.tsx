import { act, render, screen } from '@testing-library/react';
import ApiAccessSection from './ApiAccessSection';
import { mockSdk, mockCma } from '../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(
        <ApiAccessSection
          isAppInstalled={false}
          onAccountSummariesChange={() => {}}
          parameters={{}}
          onIsValidServiceAccount={() => {}}
          mergeSdkParameters={() => {}}
          isInEditMode={false}
          onInEditModeChange={() => {}}
          onHasServiceCheckErrorsChange={() => {}}
        />
      );
    });

    expect(screen.getByText('API access')).toBeInTheDocument();
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
    expect(screen.getByText('Private Key File')).toBeInTheDocument();
  });
});
