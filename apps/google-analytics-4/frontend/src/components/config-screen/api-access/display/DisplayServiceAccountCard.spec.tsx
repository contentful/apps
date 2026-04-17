import { render, screen } from '@testing-library/react';
import { mockSdk, mockCma, validServiceKeyId } from '../../../../../test/mocks';
import DisplayServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import { vi } from 'vitest';
const listAccountSummaries = vi.fn().mockResolvedValue([]);
const runReports = vi.fn().mockResolvedValue({});

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('hooks/useApi', () => ({
  useApi: () => ({
    listAccountSummaries,
    runReports,
  }),
}));

describe('Installed Service Account Card', () => {
  beforeEach(() => {
    listAccountSummaries.mockClear();
    runReports.mockClear();
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('is the active happy path', () => {
    render(
      <DisplayServiceAccountCard
        isSavingConfiguration={true}
        serviceAccountKeyId={validServiceKeyId}
        parameters={{}}
        onInEditModeChange={() => {}}
        onAccountSummariesChange={() => {}}
        isAppInstalled={true}
        onHasServiceCheckErrorsChange={() => {}}
        onIsApiAccessLoading={() => {}}
      />
    );

    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });
});
