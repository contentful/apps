import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dialog from '../../src/locations/Dialog';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSdk, expectedFields } from '../mocks';
import { mockCma } from '../mocks';

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({
    ...mockSdk,
    parameters: {
      invocation: {
        entryTitle: 'test-entry-title',
        fields: expectedFields,
      },
    },
  }),
  useAutoResizer: vi.fn(),
}));

vi.mock('../../src/utils/ConfigEntryService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getEntryConnectedFields: vi.fn().mockResolvedValue([
        {
          fieldId: 'description',
          moduleName: 'mod1',
          updatedAt: '2024-05-01T10:00:00Z',
          locale: 'es-AR',
        },
      ]),
    })),
  };
});

describe('Dialog component', () => {
  beforeEach(() => {
    // Clear any previous renders
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should display checkbox text as expected', () => {
    render(<Dialog />);

    // Check that the select all checkbox text is displayed correctly
    waitFor(() => {
      expect(screen.getByText('Select all fields (5)')).toBeInTheDocument();

      // Check that individual field checkboxes display correctly
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('(Short text)')).toBeInTheDocument();

      expect(screen.getByText('Description (en-US)')).toBeInTheDocument();
      expect(screen.getAllByText('(Text)')).toHaveLength(2);

      expect(screen.getByText('Description (es-AR)')).toBeInTheDocument();

      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('(Media)')).toBeInTheDocument();

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('(Short text list)')).toBeInTheDocument();

      expect(screen.getByText('Boolean')).toBeInTheDocument();
      expect(screen.getByText('(Boolean)')).toBeInTheDocument();

      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('(Reference)')).toBeInTheDocument();
    });
  });

  it('should allow checking supported fields but not unsupported fields', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    // Get checkboxes for supported and unsupported fields
    const titleCheckbox = screen.getByLabelText('Title', { exact: false });
    const booleanCheckbox = screen.getByLabelText('Boolean', { exact: false });
    const authorCheckbox = screen.getByLabelText('Author', { exact: false });

    // Check that supported fields are enabled
    expect(titleCheckbox).not.toBeDisabled();

    // Check that unsupported fields are disabled
    expect(booleanCheckbox).toBeDisabled();
    expect(authorCheckbox).toBeDisabled();

    // Test that we can check a supported field
    await user.click(titleCheckbox);
    expect(titleCheckbox).toBeChecked();

    // Test that we cannot check an unsupported field
    await user.click(booleanCheckbox);
    expect(booleanCheckbox).not.toBeChecked();
  });

  it('should select/unselect all supported fields when select all checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    const selectAllCheckbox = screen.getByLabelText('Select all fields (5)');
    const titleCheckbox = screen.getByLabelText('Title', { exact: false });
    const descriptionEnCheckbox = screen.getByLabelText('Description (en-US)', { exact: false });
    const descriptionEsCheckbox = screen.getByLabelText('Description (es-AR)', { exact: false });
    const imageCheckbox = screen.getByLabelText('Image', { exact: false });
    const tagsCheckbox = screen.getByLabelText('Tags', { exact: false });

    // Initially, no checkboxes should be selected
    expect(selectAllCheckbox).not.toBeChecked();
    expect(titleCheckbox).not.toBeChecked();
    expect(descriptionEnCheckbox).not.toBeChecked();
    expect(descriptionEsCheckbox).not.toBeChecked();
    expect(imageCheckbox).not.toBeChecked();
    expect(tagsCheckbox).not.toBeChecked();

    // Click select all checkbox
    await user.click(selectAllCheckbox);

    // All supported field checkboxes should now be selected
    expect(selectAllCheckbox).toBeChecked();
    expect(titleCheckbox).toBeChecked();
    expect(descriptionEnCheckbox).toBeChecked();
    expect(descriptionEsCheckbox).toBeChecked();
    expect(imageCheckbox).toBeChecked();
    expect(tagsCheckbox).toBeChecked();

    // Click select all checkbox again to unselect all
    await user.click(selectAllCheckbox);

    // All checkboxes should now be unselected
    expect(selectAllCheckbox).not.toBeChecked();
    expect(titleCheckbox).not.toBeChecked();
    expect(descriptionEnCheckbox).not.toBeChecked();
    expect(descriptionEsCheckbox).not.toBeChecked();
    expect(imageCheckbox).not.toBeChecked();
    expect(tagsCheckbox).not.toBeChecked();
  });

  it('should enable next button only when one or more fields are selected', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    const nextButton = screen.getByRole('button', { name: 'Next' });
    const titleCheckbox = screen.getByLabelText('Title', { exact: false });

    // Initially, no fields are selected, so button should be disabled
    expect(nextButton).toBeDisabled();

    // Select one field
    await user.click(titleCheckbox);
    expect(nextButton).not.toBeDisabled();

    // Unselect the field
    await user.click(titleCheckbox);
    expect(nextButton).toBeDisabled();

    // Select multiple fields
    const selectAllCheckbox = screen.getByLabelText('Select all fields (5)');
    await user.click(selectAllCheckbox);
    expect(nextButton).not.toBeDisabled();
  });

  it('should complete the full flow: select fields, map module names, send data and show results', async () => {
    const user = userEvent.setup();
    const mockCreateWithResponse = vi.fn().mockResolvedValue({
      response: {
        body: JSON.stringify({
          successQuantity: 2,
          failedQuantity: 0,
          invalidToken: false,
          missingScopes: false,
        }),
      },
    });

    mockCma.appActionCall.createWithResponse = mockCreateWithResponse;

    render(<Dialog />);

    const titleCheckbox = screen.getByLabelText('Title', { exact: false });
    const descriptionEnCheckbox = screen.getByLabelText('Description (en-US)', { exact: false });

    await user.click(titleCheckbox);
    await user.click(descriptionEnCheckbox);

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    expect(
      screen.getByText(
        `Optionally, name the Hubspot custom modules that will be synced to entry field content. Hubspot module names can include numbers, letters, hyphens (-), and underscores (_) but no spaces or special characters.`
      )
    ).toBeInTheDocument();

    const titleModuleNameInput = screen.getByLabelText('Hubspot module name for Title');
    await user.clear(titleModuleNameInput);
    await user.type(titleModuleNameInput, 'Custom-Title-Module');

    const saveAndSyncButton = screen.getByRole('button', { name: 'Save and sync' });
    await user.click(saveAndSyncButton);

    expect(mockCreateWithResponse).toHaveBeenCalledWith(
      {
        spaceId: 'test-space',
        environmentId: 'test-environment-alias',
        appDefinitionId: 'test-app',
        appActionId: 'createModulesAction',
      },
      {
        parameters: {
          fields: JSON.stringify([
            {
              ...expectedFields[0],
              moduleName: 'Custom-Title-Module',
            },
            {
              ...expectedFields[1],
              moduleName: 'test-entry-title-Description-en-US',
            },
          ]),
        },
      }
    );

    expect(mockSdk.notifier.success).toHaveBeenCalledWith('2 entry fields successfully synced.');
  });

  it('should disable checkboxes for fields that are already connected', async () => {
    render(<Dialog />);
    // Wait for the Dialog to render and async effect to run
    const descriptionEnCheckbox = await screen.findByLabelText('Description (es-AR)', {
      exact: false,
    });
    expect(descriptionEnCheckbox).toBeDisabled();
  });

  it('should validate duplicate module names and show error messages', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    const titleCheckbox = screen.getByLabelText('Title', { exact: false });
    const descriptionEnCheckbox = screen.getByLabelText('Description (en-US)', { exact: false });

    await user.click(titleCheckbox);
    await user.click(descriptionEnCheckbox);

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    const titleModuleNameInput = screen.getByLabelText('Hubspot module name for Title');
    const descriptionModuleNameInput = screen.getByLabelText('Hubspot module name for Description');

    await user.clear(titleModuleNameInput);
    await user.clear(descriptionModuleNameInput);

    await user.type(titleModuleNameInput, 'test-module');
    await user.type(descriptionModuleNameInput, 'test-module');

    await waitFor(() => {
      const errorMessages = screen.getAllByText('Module name already exists');
      expect(errorMessages).toHaveLength(2);
    });

    const saveAndSyncButton = screen.getByRole('button', { name: 'Save and sync' });
    expect(saveAndSyncButton).toBeDisabled();

    await user.clear(descriptionModuleNameInput);
    await user.type(descriptionModuleNameInput, 'different-module');

    await waitFor(() => {
      const errorMessages = screen.queryAllByText('Module name already exists');
      expect(errorMessages).toHaveLength(0);
    });

    expect(saveAndSyncButton).not.toBeDisabled();
  });

  it('should validate module name format and show appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    const titleCheckbox = screen.getByLabelText('Title', { exact: false });
    await user.click(titleCheckbox);

    const nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click(nextButton);

    const titleModuleNameInput = screen.getByLabelText('Hubspot module name for Title');

    await user.clear(titleModuleNameInput);
    await user.type(titleModuleNameInput, 'invalid@module');

    await waitFor(() => {
      expect(screen.getByText('Invalid special character')).toBeInTheDocument();
    });

    await user.clear(titleModuleNameInput);
    await user.type(titleModuleNameInput, 'module with spaces');

    await waitFor(() => {
      expect(screen.getByText('No spaces')).toBeInTheDocument();
    });

    await user.clear(titleModuleNameInput);
    await user.type(titleModuleNameInput, 'valid-module_123');

    await waitFor(() => {
      expect(screen.queryByText('Invalid special character')).not.toBeInTheDocument();
      expect(screen.queryByText('No spaces')).not.toBeInTheDocument();
    });

    const saveAndSyncButton = screen.getByRole('button', { name: 'Save and sync' });
    expect(saveAndSyncButton).not.toBeDisabled();
  });
});
