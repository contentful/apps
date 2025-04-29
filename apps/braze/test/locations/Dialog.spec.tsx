import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
  mockSdk.parameters.installation.apiKey
);

const FIELDS_STEP_TEXT = 'Select which fields';
const CODE_BLOCKS_STEP_TEXT = 'Braze Connected Content Call';

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

  it('navigates through steps and closes', async () => {
    mockSdk.parameters.invocation = {
      entryId: 'entryId',
      contentTypeId: 'contentTypeId',
      title: 'title',
    };
    render(<Dialog />);

    await screen.findByText(FIELDS_STEP_TEXT, { exact: false });

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

  it('opens directly to Code Blocks step when specified in parameters', async () => {
    mockSdk.parameters.invocation = {
      step: 'codeBlocks',
      selectedFields: new Set([mockField.uniqueId()]),
      serializedEntry: mockEntry.serialize(),
    };
    render(<Dialog />);

    await screen.findByText(CODE_BLOCKS_STEP_TEXT);
    expect(screen.getByText(mockField.uniqueId())).toBeTruthy();
    expect(screen.queryByText(FIELDS_STEP_TEXT)).toBeFalsy();
  });

  it('opens with pre-selected fields when specified in parameters', async () => {
    mockSdk.parameters.invocation = {
      step: 'fields',
      selectedFields: new Set([mockField.uniqueId()]),
      serializedEntry: mockEntry.serialize(),
    };
    render(<Dialog />);

    await screen.findByText(FIELDS_STEP_TEXT, { exact: false });
    expect(screen.getByText(mockField.name)).toBeTruthy();

    expect(screen.getByLabelText<HTMLInputElement>(mockField.name).checked).toBe(true);
  });
});
