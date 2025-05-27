import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CreateStep, { getDefaultContentBlockName } from '../../../src/components/create/CreateStep';
import { Entry } from '../../../src/fields/Entry';
import { BasicField } from '../../../src/fields/BasicField';

describe('CreateStep', () => {
  const field1 = new BasicField('field1', 'Field 1', 'test', false);
  const field2 = new BasicField('field2', 'Field 2', 'test', true);
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
        selectedLocales={['en-US', 'ga']}
        contentBlocksData={{
          names: { field1: 'Field-1', 'field2-en-US': 'Field-2-en-US', 'field2-ga': 'Field-2-ga' },
          descriptions: {
            field1: 'Field 1 description',
            'field2-en-US': 'Field 2 en-US',
            'field2-ga': 'Field 2 ga',
          },
        }}
        setContentBlocksData={() => {}}
        isSubmitting={false}
        handlePreviousStep={mockHandlePreviousStep}
        handleNextStep={mockHandleNextStep}
        creationResultFields={[]}
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

  it('renders the component with initial state', async () => {
    renderComponent();

    // Check if main elements are rendered
    expect(screen.getByText(/Edit each field/i)).toBeTruthy();
    expect(screen.getAllByText('Content Block name')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Edit content block/i })).toHaveLength(3);
  });

  it('renders the component with initial state with localized fields', async () => {
    renderComponent();

    expect(screen.getByText(/Edit each field/i)).toBeTruthy();
    expect(screen.getByText(/Field-1/i)).toBeTruthy();
    expect(screen.getByText(/Field-2-en-US/i)).toBeTruthy();
    expect(screen.getByText(/Field-2-ga/i)).toBeTruthy();
    expect(screen.getAllByText('Content Block name')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Edit content block/i })).toHaveLength(3);
  });

  it('enters edit mode when edit button is clicked', () => {
    renderComponent();

    const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
    fireEvent.click(editButtons[0]);

    // Check if form control elements appear
    expect(screen.getByTestId('content-block-description-input')).toBeTruthy();
    expect(screen.getByText('Field 1 description')).toBeTruthy();
  });

  it('updates content block when edited', () => {
    renderComponent();

    // Click edit button for first field
    const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
    fireEvent.click(editButtons[0]);

    // Type new name
    const inputName = screen.getByTestId('content-block-name-input') as HTMLInputElement;
    fireEvent.change(inputName, { target: { value: 'New Name' } });

    // Type new description
    const inputDescription = screen.getByTestId(
      'content-block-description-input'
    ) as HTMLInputElement;
    fireEvent.change(inputDescription, { target: { value: 'New Description' } });

    // Check if the new name is in the input
    expect(inputName.value).toBe('New Name');
    expect(inputDescription.value).toBe('New Description');
  });

  it('handles form submission', async () => {
    renderComponent();

    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /Send to Braze/i });
    fireEvent.click(submitButton);

    expect(mockHandleNextStep).toHaveBeenCalled();
  });

  it('shows loading state when submitting', () => {
    renderComponent({ isSubmitting: true });

    expect(screen.getByText('Creating')).toBeTruthy();
  });

  it('navigates back when back button is clicked', async () => {
    renderComponent();

    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);

    expect(mockHandlePreviousStep).toHaveBeenCalled();
  });

  describe('when trying to get the default name', () => {
    it('returns the correct default name', () => {
      const defaultName = getDefaultContentBlockName(mockEntry, 'field1');
      expect(defaultName).toBe('Test-Entry-field1');
    });
  });

  describe('when handling creation results', () => {
    it('shows success state and error message for fields', () => {
      const creationResultFields = [
        {
          fieldId: 'field1',
          success: true,
          statusCode: 200,
          message: '',
        },
        {
          fieldId: 'field2',
          locale: 'ga',
          success: true,
          statusCode: 200,
          message: '',
        },
        {
          fieldId: 'field2',
          locale: 'en-US',
          success: false,
          statusCode: 400,
          message: 'Content Block name already exists',
        },
      ];

      renderComponent({ creationResultFields });

      const errorMessage = screen.getByText('Content Block name already exists');
      expect(errorMessage).toBeTruthy();

      const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
      expect(editButtons).toHaveLength(1);
    });
  });
});
