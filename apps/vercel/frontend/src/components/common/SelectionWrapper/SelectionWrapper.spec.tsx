import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { SelectionWrapper } from './SelectionWrapper';
import { copies } from '@constants/copies';
import { errorMessages } from '@constants/errorMessages';

describe('SelectionWrapper', () => {
  let helpText: string | React.ReactNode;

  beforeEach(() => {
    helpText = 'help text';
  });

  it('renders content', () => {
    const { label } = copies.configPage.pathSelectionSection;
    const { unmount } = render(
      <SelectionWrapper
        label={label}
        helpText={helpText}
        errorMessage={errorMessages.apiPathNotFound}
        isLoading={false}>
        <div>Test Child</div>
      </SelectionWrapper>
    );
    const labelElement = screen.getByText(label);
    const helpTextElement = screen.getByText(helpText as string);
    const errorMessageElement = screen.getByText(errorMessages.apiPathNotFound);

    expect(labelElement).toBeTruthy();
    expect(helpTextElement).toBeTruthy();
    expect(errorMessageElement).toBeTruthy();

    unmount();
  });

  describe('when helpText is a React node', () => {
    beforeEach(() => {
      helpText = <div data-testid="help-text">help div</div>;
    });

    it('renders content', () => {
      const { label } = copies.configPage.pathSelectionSection;
      const { unmount } = render(
        <SelectionWrapper
          label={label}
          helpText={helpText}
          errorMessage={errorMessages.apiPathNotFound}
          isLoading={false}>
          <div>Test Child</div>
        </SelectionWrapper>
      );
      const labelElement = screen.getByText(label);
      const helpTextElement = screen.getByTestId('help-text');
      const errorMessageElement = screen.getByText(errorMessages.apiPathNotFound);

      expect(labelElement).toBeTruthy();
      expect(helpTextElement).toBeTruthy();
      expect(errorMessageElement).toBeTruthy();

      unmount();
    });
  });
});
