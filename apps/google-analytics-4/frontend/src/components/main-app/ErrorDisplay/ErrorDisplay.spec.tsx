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

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

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

    expect(
      screen.findByText(INVALID_ARGUMENT_MSG.replace(HYPER_LINK_COPY, '').trim())
    ).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
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

    expect(screen.findByText(PERMISSION_DENIED_MSG)).toBeVisible();
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

    expect(screen.findByText(DEFAULT_ERR_MSG.replace(HYPER_LINK_COPY, '').trim())).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
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

    expect(
      screen.findByText(INVALID_SERVICE_ACCOUNT.replace(HYPER_LINK_COPY, '').trim())
    ).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
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

    expect(
      screen.findByText(INVALID_SERVICE_ACCOUNT.replace(HYPER_LINK_COPY, '').trim())
    ).toBeVisible();
    expect(screen.getByTestId('cf-ui-text-link')).toBeVisible();
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

    expect(screen.findByText(INTERNAL_ERR_MSG)).toBeVisible();
  });

  it('mounts with correct msg when error is not a specified Api Error Type', async () => {
    const ERR_MSG = 'random error';
    render(<ErrorDisplay error={new Error(ERR_MSG)} />);

    expect(screen.findByText(ERR_MSG)).toBeVisible();
  });
});
