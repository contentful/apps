import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextFieldSection } from './TextFieldSection';
import { copies } from '@constants/copies';

describe('TextFieldSection', () => {
  it('renders text field with value', () => {
    const value = 'api/disable-path';
    const { textInputPlaceholder } = copies.configPage.pathSelectionSection;
    render(<TextFieldSection value={value} />);

    const input = document.querySelector('input');
    expect(input).toBeTruthy();
    expect(input).toHaveProperty('value', value);
    expect(input).toHaveProperty('placeholder', textInputPlaceholder);
  });
});
