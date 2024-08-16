import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldSelector from './FieldSelector';
import { vi, describe, it, expect } from 'vitest';

const contentTypes = [
  {
    sys: { id: 'ct1' },
    name: 'Content Type 1',
  },
  {
    sys: { id: 'ct2' },
    name: 'Content Type 2',
  },
];

const compatibleFields = {
  ct1: [
    { id: 'field1', name: 'Field 1', type: 'Symbol' },
    { id: 'field2', name: 'Field 2', type: 'Symbol' },
  ],
  ct2: [
    { id: 'field3', name: 'Field 3', type: 'Symbol' },
    { id: 'field4', name: 'Field 4', type: 'Symbol' },
  ],
};

const selectedFields = {
  ct1: ['field1'],
  ct2: [],
};

describe('FieldSelector', () => {
  it('renders content types and fields correctly', () => {
    render(
      <FieldSelector
        contentTypes={contentTypes}
        compatibleFields={compatibleFields}
        selectedFields={selectedFields}
        onSelectedFieldsChange={vi.fn()}
      />
    );

    expect(screen.getByText('Content Type 1')).toBeInTheDocument();
    expect(screen.getByText('Content Type 2')).toBeInTheDocument();
    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();
    expect(screen.getByText('Field 3')).toBeInTheDocument();
    expect(screen.getByText('Field 4')).toBeInTheDocument();

    const field1Checkbox = screen.getByLabelText('Field 1');
    const field2Checkbox = screen.getByLabelText('Field 2');

    expect(field1Checkbox).toBeChecked();
    expect(field2Checkbox).not.toBeChecked();
  });

  it('calls onSelectedFieldsChange with correct arguments when a checkbox is checked', () => {
    const onSelectedFieldsChangeMock = vi.fn();

    render(
      <FieldSelector
        contentTypes={contentTypes}
        compatibleFields={compatibleFields}
        selectedFields={selectedFields}
        onSelectedFieldsChange={onSelectedFieldsChangeMock}
      />
    );

    const field2Checkbox = screen.getByLabelText('Field 2');
    fireEvent.click(field2Checkbox);

    expect(onSelectedFieldsChangeMock).toHaveBeenCalledWith({
      ...selectedFields,
      ct1: ['field1', 'field2'],
    });
  });

  it('calls onSelectedFieldsChange with correct arguments when a checkbox is unchecked', () => {
    const onSelectedFieldsChangeMock = vi.fn();

    render(
      <FieldSelector
        contentTypes={contentTypes}
        compatibleFields={compatibleFields}
        selectedFields={{
          ct1: ['field1', 'field2'],
          ct2: [],
        }}
        onSelectedFieldsChange={onSelectedFieldsChangeMock}
      />
    );

    const field2Checkbox = screen.getByLabelText('Field 2');
    fireEvent.click(field2Checkbox);

    expect(onSelectedFieldsChangeMock).toHaveBeenCalledWith({
      ...selectedFields,
      ct1: ['field1'],
    });
  });
});
