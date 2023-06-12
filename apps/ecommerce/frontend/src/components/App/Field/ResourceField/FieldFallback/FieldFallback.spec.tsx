import FieldFallback from './FieldFallback';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk } from '../../../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ...mockSdk,
    dialogs: {
      openConfirm: jest.fn(),
    },
  }),
  useCMA: () => mockCma,
  useAutoResizer: jest.fn(),
}));

const { getByText } = screen;

describe('FieldFallback component', () => {
  it('mounts', () => {
    render(
      <FieldFallback error={{ message: 'Woops', name: 'an error' }} resetErrorHandler={() => {}} />
    );

    const retryButton = getByText('Retry');
    const resetButton = getByText('Reset JSON');

    expect(retryButton).toBeVisible();
    expect(resetButton).toBeVisible();
  });

  it('handles retry', async () => {
    const mockResetHandler = jest.fn();
    render(
      <FieldFallback
        error={{ message: 'Woops', name: 'an error' }}
        resetErrorHandler={mockResetHandler}
      />
    );

    const retryButton = getByText('Retry');
    await userEvent.click(retryButton);

    expect(mockResetHandler).toHaveBeenCalled();
  });
});
