import ErrorDisplay from './ErrorDisplay';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '../../../../test/mocks';
import {
  DEFAULT_ERR_MSG,
  INVALID_ARGUMENT_MSG,
  INVALID_SERVICE_ACCOUNT,
  PERMISSION_DENIED_MSG,
} from '../constants/noteMessages';
import { ApiError } from 'apis/api';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const { findByText, getByTestId } = screen;

describe('ErrorDisplay', () => {
  it('mounts with correct msg and hyperlink when error is of type InvalidProperty', async () => {
    const HYPER_LINK_COPY = 'app configuration page.';
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: '',
            status: 404,
            errorType: 'InvalidProperty',
          })
        }
      />
    );

    const warningMsg = await findByText(INVALID_ARGUMENT_MSG.replace(HYPER_LINK_COPY, '').trim());
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
            message: '',
            status: 404,
            errorType: 'DisabledDataApi',
          })
        }
      />
    );

    const warningMsg = await findByText(PERMISSION_DENIED_MSG);

    expect(warningMsg).toBeVisible();
  });

  it('mounts with correct msg when error is of type FailedFetch', async () => {
    const HYPER_LINK_COPY = 'contact support.';
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: '',
            status: 404,
            errorType: 'FailedFetch',
          })
        }
      />
    );

    const warningMsg = await findByText(DEFAULT_ERR_MSG.replace(HYPER_LINK_COPY, '').trim());
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg when error is of type InvalidServiceAccount', async () => {
    const HYPER_LINK_COPY = 'app configuration page.';
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: '',
            status: 404,
            errorType: 'InvalidServiceAccount',
          })
        }
      />
    );

    const warningMsg = await findByText(
      INVALID_SERVICE_ACCOUNT.replace(HYPER_LINK_COPY, '').trim()
    );
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg when error is of type InvalidServiceAccountKey', async () => {
    const HYPER_LINK_COPY = 'app configuration page.';
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: '',
            status: 404,
            errorType: 'InvalidServiceAccountKey',
          })
        }
      />
    );

    const warningMsg = await findByText(
      INVALID_SERVICE_ACCOUNT.replace(HYPER_LINK_COPY, '').trim()
    );
    const hyperLink = getByTestId('cf-ui-text-link');

    expect(warningMsg).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('mounts with correct msg when error is of ApiError class but not an Error type explicitely handled', async () => {
    const INTERNAL_ERR_MSG = 'Internal Server Error';
    render(
      <ErrorDisplay
        error={
          new ApiError({
            details: '',
            message: INTERNAL_ERR_MSG,
            status: 500,
            errorType: '',
          })
        }
      />
    );

    const warningMsg = await findByText(INTERNAL_ERR_MSG);

    expect(warningMsg).toBeVisible();
  });

  it('mounts with correct msg when error is not a specified Api Error Type ', async () => {
    const ERR_MSG = 'random error';
    render(<ErrorDisplay error={new Error(ERR_MSG)} />);

    const warningMsg = await findByText(ERR_MSG);

    expect(warningMsg).toBeVisible();
  });
});
