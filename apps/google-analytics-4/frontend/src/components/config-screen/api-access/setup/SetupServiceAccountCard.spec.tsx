import { act, render, screen } from '@testing-library/react';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { mockSdk, mockCma } from '../../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Setup Google Service Account Details page', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(
        <SetupServiceAccountCard
          parameters={{}}
          onIsValidServiceAccount={() => {}}
          mergeSdkParameters={() => {}}
          onInEditModeChange={() => {}}
          isInEditMode={false}
          onKeyFileUpdate={() => {}}
        />
      );
    });

    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });
});
