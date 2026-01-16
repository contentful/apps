import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../mocks';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Dialog from '../../src/locations/Dialog';
import { Entry } from '../../src/fields/Entry';
import { BasicField } from '../../src/fields/BasicField';
import React from 'react';
import { createEntryResponse } from '../mocks/entryResponse';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

const mockGetEntry = vi.fn();
const mockCreateFieldsForEntry = vi.fn();
vi.mock('../../src/fields/FieldsFactory', () => ({
  FieldsFactory: vi.fn().mockImplementation(() => ({
    getEntry: mockGetEntry,
    createFieldsForEntry: mockCreateFieldsForEntry,
  })),
}));

const mockCMAEntryItemResponse = createEntryResponse({
  title: 'Some Title',
  fieldId: {
    sys: {
      id: 'referencedEntryId',
      linkType: 'Entry',
      type: 'Link',
    },
  },
});

const mockField = new BasicField('fieldId', 'fieldName', 'contentTypeId', false);
mockField.selected = true;

const mockEntry = new Entry(
  'entryId',
  'contentTypeId',
  'title',
  [mockField],
  mockSdk.ids.space,
  mockSdk.ids.environemnt,
  mockSdk.parameters.installation.contentfulApiKey,
  undefined,
  '2024-01-01T00:00:00Z'
);

const GENERATE_FIELDS_STEP_TEXT = 'Select which fields';
const CODE_BLOCKS_STEP_TEXT = 'Braze Connected Content Call';
const CREATE_FIELDS_STEP_TEXT = 'generate into Content Blocks';

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEntry.mockResolvedValue(mockCMAEntryItemResponse);
    mockCreateFieldsForEntry.mockResolvedValue([mockField]);
    vi.spyOn(mockEntry, 'getGraphQLResponse').mockImplementation(async () => 'graphql response');
    vi.spyOn(Entry, 'fromSerialized').mockImplementation(() => mockEntry);
    mockSdk.cma.entry.get.mockResolvedValue({
      fields: {
        connectedFields: {
          'en-US': {
            [mockSdk.ids.entry]: [
              {
                fieldId: 'fieldA',
                contentBlockId: 'contentBlockA',
              },
            ],
          },
        },
      },
    });
    mockSdk.parameters.invocation = undefined;
    mockSdk.close = vi.fn();
  });
  afterEach(cleanup);

  it('Generate wizard navigates through steps and closes', async () => {
    mockSdk.parameters.invocation = {
      mode: 'generate',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };
    render(<Dialog />);

    await screen.findByText(GENERATE_FIELDS_STEP_TEXT, { exact: false });

    expect(screen.getByLabelText<HTMLInputElement>(mockField.name).checked).toBe(false);

    fireEvent.click(screen.getByLabelText(mockField.name));
    expect(screen.getByLabelText<HTMLInputElement>(mockField.name).checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(mockSdk.close).toHaveBeenCalledWith({
      contentTypeId: 'contentTypeId',
      entryId: 'entryId',
      serializedEntry: mockEntry.serialize(),
      step: 'codeBlocks',
      title: 'title',
    });
  });

  it('Generate wizard opens directly to Code Blocks step when specified in parameters', async () => {
    mockSdk.parameters.invocation = {
      mode: 'generate',
      step: 'codeBlocks',
      selectedFields: new Set([mockField.uniqueId()]),
      serializedEntry: mockEntry.serialize(),
    };
    render(<Dialog />);

    await screen.findByText(CODE_BLOCKS_STEP_TEXT);
    expect(screen.getByText(mockField.uniqueId())).toBeTruthy();
    expect(screen.queryByText(GENERATE_FIELDS_STEP_TEXT)).toBeFalsy();
  });

  it('Generate wizard opens with pre-selected fields when specified in parameters', async () => {
    mockSdk.parameters.invocation = {
      mode: 'generate',
      step: 'fields',
      selectedFields: new Set([mockField.uniqueId()]),
      serializedEntry: mockEntry.serialize(),
    };
    render(<Dialog />);

    await screen.findByText(GENERATE_FIELDS_STEP_TEXT, { exact: false });
    expect(screen.getByText(mockField.name)).toBeTruthy();

    expect(screen.getByLabelText<HTMLInputElement>(mockField.name).checked).toBe(true);
  });

  it('Create wizard navigates through steps, show succes step and closes', async () => {
    mockSdk.parameters.invocation = {
      mode: 'create',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };
    mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          results: [
            { fieldId: 'fieldId', success: true, status: 201, contentBlockId: 'contentBlockId' },
          ],
        }),
      },
    });

    render(<Dialog />);

    await navigateToFinalStep();

    const successStepParagraph = await screen.findByText(
      'You can view them from your Braze dashboard by navigating to',
      {
        exact: false,
      }
    );

    expect(successStepParagraph).toBeTruthy();
  });

  it('Display client errors message correctly', async () => {
    mockSdk.parameters.invocation = {
      mode: 'create',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };

    mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          results: [
            {
              fieldId: 'name',
              success: false,
              statusCode: 400,
              message: 'Content block name not found or has no value for field name',
            },
            {
              fieldId: 'lastname',
              success: false,
              statusCode: 400,
              message: 'Content block name not found or has no value for field lastname',
            },
          ],
        }),
      },
    });

    render(<Dialog />);

    await navigateToFinalStep();

    await screen.findByText('There was an issue with some Content Blocks');

    expect(
      screen.getByText('Content block name not found or has no value for field name', {
        exact: false,
      })
    ).toBeTruthy();
    expect(
      screen.getByText('Content block name not found or has no value for field lastname', {
        exact: false,
      })
    ).toBeTruthy();
  });

  it('Display server error message correctly', async () => {
    mockSdk.parameters.invocation = {
      mode: 'create',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };

    mockSdk.cma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          results: [
            {
              fieldId: 'name',
              success: false,
              statusCode: 500,
              message: 'Internal server error',
            },
            {
              fieldId: 'lastname',
              success: false,
              statusCode: 500,
              message: 'Internal server error',
            },
          ],
        }),
      },
    });

    render(<Dialog />);

    await navigateToFinalStep();

    await screen.findByText('There was an issue with some Content Blocks');

    const errorMessages = screen.getAllByText(
      'Internal server error. Please retry sending to Braze.',
      { exact: false }
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    errorMessages.forEach((message) => {
      expect(message).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
  });

  it('Retry button works correctly after server error', async () => {
    mockSdk.parameters.invocation = {
      mode: 'create',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };

    mockSdk.cma.appActionCall.createWithResponse
      .mockResolvedValueOnce({
        response: {
          body: JSON.stringify({
            results: [
              {
                fieldId: 'name',
                success: false,
                statusCode: 500,
                message: 'Internal server error',
              },
            ],
          }),
        },
      })
      .mockResolvedValueOnce({
        response: {
          body: JSON.stringify({
            results: [
              {
                fieldId: 'name',
                success: true,
                statusCode: 201,
                contentBlockId: 'contentBlockId',
              },
            ],
          }),
        },
      });

    render(<Dialog />);

    await navigateToFinalStep();

    await screen.findByText('There was an issue with some Content Blocks');

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeTruthy();
    fireEvent.click(retryButton);

    const successMessage = await screen.findByText(
      'You can view them from your Braze dashboard by navigating to',
      { exact: false }
    );
    expect(successMessage).toBeTruthy();
  });
});

async function navigateToFinalStep() {
  await screen.findByText(CREATE_FIELDS_STEP_TEXT, { exact: false });

  const multiSelect = screen.getByText('Select one or more');
  expect(multiSelect).toBeTruthy();

  fireEvent.click(multiSelect);

  const checkbox = screen.getByRole('checkbox', {
    name: mockField.displayNameForGenerate(),
  });
  expect(checkbox).toBeTruthy();

  fireEvent.click(checkbox);

  const nextButton = screen.getByRole('button', { name: /next/i });
  expect(nextButton).toBeTruthy();

  fireEvent.click(nextButton);

  const createStepParagraph = screen.getByText('Edit each field to change', {
    exact: false,
  });
  expect(createStepParagraph).toBeTruthy();

  const sendToBrazeButtonCreateStep = screen.getByRole('button', { name: /Send to Braze/i });
  expect(sendToBrazeButtonCreateStep).toBeTruthy();

  fireEvent.click(sendToBrazeButtonCreateStep);

  const draftStepParagraph = screen.getByText('This entry has not yet been published', {
    exact: false,
  });
  expect(draftStepParagraph).toBeTruthy();

  const sendToBrazeButtonDraftStep = screen.getByRole('button', { name: /Send to Braze/i });
  expect(sendToBrazeButtonDraftStep).toBeTruthy();

  fireEvent.click(sendToBrazeButtonDraftStep);
}
