import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CreateStep, {
  CreateStepProps,
  getDefaultContentBlockName,
} from '../../../src/components/create/CreateStep';
import { Entry } from '../../../src/fields/Entry';
import { BasicField } from '../../../src/fields/BasicField';
import React, { useState } from 'react';
import { ContentBlockData } from '../../../src/components/create/CreateFlow';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const TestCreateStepWrapper = (
    props: Partial<CreateStepProps> & {
      initialContentBlocksData?: ContentBlockData;
    }
  ) => {
    const [contentBlocksData, setContentBlocksData] = useState<ContentBlockData>(
      props.initialContentBlocksData || { names: {}, descriptions: {} }
    );

    return (
      <CreateStep
        entry={mockEntry}
        selectedFields={mockSelectedFields}
        selectedLocales={['en-US', 'ga']}
        isSubmitting={false}
        handlePreviousStep={mockHandlePreviousStep}
        handleNextStep={mockHandleNextStep}
        creationResultFields={[]}
        {...props}
        contentBlocksData={contentBlocksData}
        setContentBlocksData={setContentBlocksData}
      />
    );
  };

  it('renders the component without', async () => {
    await act(async () => {
      render(<TestCreateStepWrapper />);
    });

    expect(screen.getByText(/Edit each field/i)).toBeTruthy();
    expect(screen.getByText('Test-Entry-field1')).toBeTruthy();
    expect(screen.getByText('Test-Entry-field2-en-US')).toBeTruthy();
    expect(screen.getByText('Test-Entry-field2-ga')).toBeTruthy();
    expect(screen.getAllByText('Content Block name')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Edit content block/i })).toHaveLength(3);
  });

  it('renders the component with initial state', async () => {
    await act(async () => {
      render(
        <TestCreateStepWrapper
          initialContentBlocksData={{
            names: {
              field1: 'Field 1 custom',
              'field2-en-US': 'Field 2 en-US custom',
              'field2-ga': 'Field 2 ga custom',
            },
            descriptions: {
              field1: 'Field 1 description custom',
              'field2-en-US': 'Field 2 en-US description custom',
              'field2-ga': 'Field 2 ga description custom',
            },
          }}
        />
      );
    });

    expect(screen.getByText(/Edit each field/i)).toBeTruthy();
    expect(screen.getByText('Field 1 custom')).toBeTruthy();
    expect(screen.getByText('Field 2 en-US custom')).toBeTruthy();
    expect(screen.getByText('Field 2 ga custom')).toBeTruthy();
    expect(screen.getByText('Field 1 description custom')).toBeTruthy();
    expect(screen.getByText('Field 2 en-US description custom')).toBeTruthy();
    expect(screen.getByText('Field 2 ga description custom')).toBeTruthy();
    expect(screen.getAllByText('Content Block name')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /Edit content block/i })).toHaveLength(3);
  });

  it('enters edit mode when edit button is clicked', async () => {
    await act(async () => {
      render(<TestCreateStepWrapper />);
    });

    const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
    fireEvent.click(editButtons[0]);

    // Check if form control elements appear
    expect(screen.getByTestId('content-block-description-input')).toBeTruthy();
  });

  it('updates content block when edited', async () => {
    await act(async () => {
      render(<TestCreateStepWrapper />);
    });

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
    await act(async () => {
      render(<TestCreateStepWrapper />);
    });

    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /Send to Braze/i });
    fireEvent.click(submitButton);

    expect(mockHandleNextStep).toHaveBeenCalled();
  });

  it('shows loading state when submitting', async () => {
    await act(async () => {
      render(<TestCreateStepWrapper isSubmitting={true} />);
    });

    expect(screen.getByText('Creating')).toBeTruthy();
  });

  it('navigates back when back button is clicked', async () => {
    await act(async () => {
      render(<TestCreateStepWrapper />);
    });

    const backButton = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backButton);

    expect(mockHandlePreviousStep).toHaveBeenCalled();
  });

  describe('when trying to get the default name', () => {
    it('returns the correct default name', () => {
      const defaultName = getDefaultContentBlockName(mockEntry, 'field1');
      expect(defaultName).toBe('Test-Entry-field1');
    });

    it('removes any not permitted characters', () => {
      mockEntry.title = 'Test Entry!!!';
      const defaultName = getDefaultContentBlockName(mockEntry, 'field1');
      expect(defaultName).toBe('Test-Entry-field1');
    });
  });

  describe('when handling creation results', () => {
    it('shows success state and error message for fields', async () => {
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

      await act(async () => {
        render(<TestCreateStepWrapper creationResultFields={creationResultFields} />);
      });

      const errorMessage = screen.getByText('Content Block name already exists');
      expect(errorMessage).toBeTruthy();

      const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
      expect(editButtons).toHaveLength(1);
    });

    it('hides the error after saving a new value for the content block name', async () => {
      const creationResultFields = [
        {
          fieldId: 'field1',
          success: false,
          statusCode: 400,
          message: 'Content Block name already exists',
        },
      ];

      await act(async () => {
        render(<TestCreateStepWrapper creationResultFields={creationResultFields} />);
      });

      // Error is shown initially
      expect(screen.getByText('Content Block name already exists')).toBeTruthy();

      // Click edit button for the field with error
      const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
      fireEvent.click(editButtons[0]);

      // Change the name to a new valid value
      const inputName = screen.getByTestId('content-block-name-input') as HTMLInputElement;
      fireEvent.change(inputName, { target: { value: 'NewName' } });

      // Save the changes
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Error should no longer be shown
      expect(screen.queryByText('Content Block name already exists')).toBeNull();
    });

    it('hides the error for a localized field after saving a new value', async () => {
      const creationResultFields = [
        {
          fieldId: 'field2',
          locale: 'en-US',
          success: false,
          statusCode: 400,
          message: 'Content Block name already exists',
        },
      ];

      await act(async () => {
        render(<TestCreateStepWrapper creationResultFields={creationResultFields} />);
      });

      // Error is shown initially
      expect(screen.getByText('Content Block name already exists')).toBeTruthy();

      // Find and click edit button for the localized field with error
      const editButtons = screen.getAllByRole('button', { name: /Edit content block/i });
      // The second edit button corresponds to field2-en-US
      fireEvent.click(editButtons[1]);

      // Change the name to a new valid value
      const inputName = screen.getByTestId('content-block-name-input') as HTMLInputElement;
      fireEvent.change(inputName, { target: { value: 'NewLocalizedName' } });

      // Save the changes
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      // Error should no longer be shown
      expect(screen.queryByText('Content Block name already exists')).toBeNull();
    });

    it('calls handlePreviousStep when back button is clicked', async () => {
      const creationResultFields = [
        {
          fieldId: 'field1',
          success: false,
          statusCode: 400,
          message: 'Content Block name already exists',
        },
      ];

      await act(async () => {
        render(<TestCreateStepWrapper creationResultFields={creationResultFields} />);
      });

      // Error is shown initially
      expect(screen.getByText('Content Block name already exists')).toBeTruthy();

      // Click the back button
      const backButton = screen.getByRole('button', { name: 'Back' });
      fireEvent.click(backButton);

      // Verify handlePreviousStep was called
      expect(mockHandlePreviousStep).toHaveBeenCalled();
    });

    it('shows no errors when creationResultFields is empty', async () => {
      await act(async () => {
        render(<TestCreateStepWrapper creationResultFields={[]} />);
      });

      // No error messages should be shown
      expect(screen.queryByText('Content Block name already exists')).toBeNull();
      expect(screen.queryByText('Another error message')).toBeNull();
    });
  });
});
