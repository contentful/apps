import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SelectionWrapper } from './SelectionWrapper';
import { copies } from '@constants/copies';

describe('SelectionWrapper', () => {
  it('renders content', () => {
    const { label, helpText, errorMessage } = copies.configPage.pathSelectionSection;
    render(
      <SelectionWrapper
        label={label}
        helpText={helpText}
        errorMessage={errorMessage}
        isLoading={false}>
        <div>Test Child</div>
      </SelectionWrapper>
    );
    const labelElement = screen.getByText(label);
    const helpTextElement = screen.getByText(helpText);
    const errorMessageElement = screen.getByText(errorMessage);

    expect(labelElement).toBeTruthy();
    expect(helpTextElement).toBeTruthy();
    expect(errorMessageElement).toBeTruthy();
  });
});
