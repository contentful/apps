import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CreateStep from '../../../src/components/create/CreateStep';
import { Entry } from '../../../src/fields/Entry';
import { BasicField } from '../../../src/fields/BasicField';

describe('CreateStep', () => {
  const field1 = new BasicField('field1', 'Field 1', 'test', false);
  const field2 = new BasicField('field2', 'Field 2', 'test', false);
  const mockEntry = new Entry(
    'entry-id',
    'test',
    'Test Entry',
    [field1, field2],
    'space-id',
    'environment-id',
    'api-token'
  );

  const mockSelectedFields = new Set(['field1', 'field2']);
  const mockHandlePreviousStep = vi.fn();
  const mockHandleNextStep = vi.fn();

  const renderComponent = (props = {}) => {
    return render(
      <CreateStep
        entry={mockEntry}
        selectedFields={mockSelectedFields}
        contentBlockStates={{}}
        setContentBlockStates={() => {}}
        isSubmitting={false}
        handlePreviousStep={mockHandlePreviousStep}
        handleNextStep={mockHandleNextStep}
        {...props}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the component with initial state', () => {
    renderComponent();

    // Check if main elements are rendered
    expect(screen.getByText(/Edit each field/i)).toBeTruthy();
    expect(screen.getAllByText('Name')).toHaveLength(mockSelectedFields.size);
    expect(screen.getAllByRole('button', { name: /Edit content block/i })).toHaveLength(
      mockSelectedFields.size
    );
  });

  it('shows default content block names', () => {
    renderComponent();

    mockSelectedFields.forEach((fieldId) => {
      const expectedName = `Test-Entry-${fieldId}`;
      expect(screen.getByText(expectedName)).toBeTruthy();
    });
  });

  it('enters edit mode when edit button is clicked', () => {
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
    fireEvent.click(editButtons[0]);

    // Check if form control elements appear
    expect(screen.getByText('Name should be unique.')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('updates content block name when edited', () => {
    renderComponent();

    // Click edit button for first field
    const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
    fireEvent.click(editButtons[0]);

    // Type new name
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Name' } });

    // Check if the new name is in the input
    expect(input.value).toBe('New Name');
  });

  it('handles form submission', () => {
    renderComponent();

    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /Send to Braze/i });
    fireEvent.click(submitButton);

    expect(mockHandleNextStep).toHaveBeenCalled();
  });

  it('shows loading state when submitting', () => {
    renderComponent({ isSubmitting: true });

    expect(screen.getByText('Creating...')).toBeTruthy();
  });

  it('navigates back when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);

    expect(mockHandlePreviousStep).toHaveBeenCalled();
  });
});
