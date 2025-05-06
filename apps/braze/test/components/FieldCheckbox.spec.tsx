import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import FieldCheckbox from '../../src/components/FieldCheckbox';
import { RichTextField } from '../../src/fields/RichTextField';

describe('FieldCheckbox component', () => {
  it('Rich text field shows as disabled', () => {
    const richTextField = new RichTextField('id', 'name', 'contentType', false);
    const { getByText, container } = render(
      <FieldCheckbox field={richTextField} handleToggle={() => {}} selectedFields={new Set()} />
    );
    expect(getByText(richTextField.displayNameForGenerate())).toBeTruthy();
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox?.disabled).toBe(true);
  });
});
