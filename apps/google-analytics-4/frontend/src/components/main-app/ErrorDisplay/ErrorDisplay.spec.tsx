import ErrorDisplay from './ErrorDisplay';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import { INVALID_ARGUMENT_MSG, PERMISSION_DENIED_MSG } from '../constants/noteMessages';
import { ApiError } from 'apis/api';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const HYPER_LINK_MSG = 'app configuration page.';

const { findByText, getByTestId } = screen;

describe('ErrorDisplay', () => {
  it('mounts with correct msg and hyperlink when error is of type InvalidProperty', async () => {
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: 'api Error',
            status: 404,
            errorType: 'InvalidProperty',
          })
        }
      />
    );

    const warningMsg = await findByText(INVALID_ARGUMENT_MSG.replace(HYPER_LINK_MSG, '').trim());
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg when error is of type DisabledDataApi', async () => {
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: 'api Error',
            status: 404,
            errorType: 'DisabledDataApi',
          })
        }
      />
    );

    const warningMsg = await findByText(PERMISSION_DENIED_MSG);

    expect(warningMsg).toBeVisible();
  });

  it('mounts with correct msg when error is not a specified Api Error Type ', async () => {
    render(<ErrorDisplay error={new Error('random error')} />);

    const warningMsg = await findByText('random error');

    expect(warningMsg).toBeVisible();
  });
});
