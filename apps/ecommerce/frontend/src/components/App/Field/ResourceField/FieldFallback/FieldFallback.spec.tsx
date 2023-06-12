import FieldFallback from './FieldFallback';
import { render, screen, fireEvent } from '@testing-library/react';
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

const { getByText, findByText } = screen;

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

  it('handles retry', () => {
    const mockResetHandler = jest.fn();
    render(
      <FieldFallback
        error={{ message: 'Woops', name: 'an error' }}
        resetErrorHandler={mockResetHandler}
      />
    );

    const retryButton = getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockResetHandler).toHaveBeenCalled();
  });
});
