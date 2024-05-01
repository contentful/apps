import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { ApiPathSelectionSection } from './ApiPathSelectionSection';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { ApiPath } from '@customTypes/configPage';

describe('ApiPathSelectionSection', () => {
  it('renders dropdown when paths are present and no errors are present', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const { unmount } = renderConfigPageComponent(<ApiPathSelectionSection paths={paths} />);

    const select = screen.getByTestId('optionsSelect');
    expect(select).toBeTruthy();
    unmount();
  });

  it('renders dropdown when apiPathNotFound error is present', () => {
    const paths = [{ id: 'path-1', name: 'Path/1' }];
    const errors = { apiPathSelection: { apiPathNotFound: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const select = screen.getByTestId('optionsSelect');
    expect(select).toBeTruthy();
    unmount();
  });

  it('renders textfield when no paths', () => {
    const paths: ApiPath[] = [];
    const { unmount } = renderConfigPageComponent(<ApiPathSelectionSection paths={paths} />);

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });

  it('renders textfield when invalidDeploymentData error', () => {
    const paths: ApiPath[] = [];
    const errors = { apiPathSelection: { invalidDeploymentData: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });

  it('renders textfield when cannotFetchApiPaths error', () => {
    const paths: ApiPath[] = [];
    const errors = { apiPathSelection: { cannotFetchApiPaths: true } };
    const { unmount } = renderConfigPageComponent(
      <ApiPathSelectionSection paths={paths} />,
      errors
    );

    const input = screen.getByTestId('apiPathInput');
    expect(input).toBeTruthy();
    unmount();
  });
});
