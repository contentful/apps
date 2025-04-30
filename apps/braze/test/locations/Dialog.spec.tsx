import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Dialog from '../../src/locations/Dialog';
import React from 'react';
import { Entry } from '../../src/fields/Entry';
import { BasicField } from '../../src/fields/BasicField';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

const mockCreateFields = vi.fn();
vi.mock('../../src/fields/FieldsFactory', () => ({
  FieldsFactory: vi.fn().mockImplementation(() => ({
    createFields: mockCreateFields,
  })),
}));

const mockField = new BasicField('fieldId', 'fieldName', 'contentTypeId', false);
mockField.selected = true;

const mockEntry = new Entry(
  'entryId',
  'contentTypeId',
  'title',
  [mockField],
  mockSdk.ids.space,
  mockSdk.ids.environemnt,
  mockSdk.parameters.installation.contentfulApiKey
);

const GENERATE_FIELDS_STEP_TEXT = 'Select which fields';
const CODE_BLOCKS_STEP_TEXT = 'Braze Connected Content Call';
const CREATE_FIELDS_STEP_TEXT = 'generate into Content Blocks';

describe('Dialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFields.mockResolvedValue([mockField]);
    vi.spyOn(mockEntry, 'getGraphQLResponse').mockImplementation(async () => 'graphql response');
    vi.spyOn(Entry, 'fromSerialized').mockImplementation(() => mockEntry);
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

  it('Create wizard navigates through steps and closes', async () => {
    mockSdk.parameters.invocation = {
      mode: 'create',
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };

    render(<Dialog />);

    await screen.findByText(CREATE_FIELDS_STEP_TEXT, { exact: false });

    const select = screen.getByTestId(`select-${mockEntry.id}`) as HTMLSelectElement;
    expect(select).toBeTruthy();

    fireEvent.change(select, { target: { value: mockField.name } });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const createStepParagraph = await screen.findByText('Edit each field to change', {
      exact: false,
    });
    expect(createStepParagraph).toBeTruthy();
  });
});
