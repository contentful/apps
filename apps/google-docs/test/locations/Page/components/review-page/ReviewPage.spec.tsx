import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewPage } from '../../../../../src/locations/Page/components/review-page/ReviewPage';
import { ReviewPayload } from '../../../../../src/utils/types';

const reviewPayload: ReviewPayload = {
  documentTitle: 'NRF Coffee Truck 2026',
  reviewSummary: 'Review completed',
  summary: '2 mapped blocks, 1 unmapped block',
  unmappedBlockIds: ['block-3'],
  rawDocJson: {
    title: 'NRF Coffee Truck 2026',
    body: {
      content: [
        {
          paragraph: {
            paragraphStyle: { namedStyleType: 'HEADING_2' },
            elements: [{ textRun: { content: 'Conference\n' } }],
          },
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Original raw doc paragraph.\n' } }],
          },
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Save main-character energy at NRF.\n' } }],
          },
        },
        {
          paragraph: {
            elements: [{ inlineObjectElement: { inlineObjectId: 'inline-image-1' } }],
          },
        },
        {
          table: {
            tableRows: [
              {
                tableCells: [
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: 'Column A\n' } }],
                        },
                      },
                    ],
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: 'Column B\n' } }],
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    inlineObjects: {
      'inline-image-1': {
        inlineObjectProperties: {
          embeddedObject: {
            title: 'Coffee image',
            imageProperties: {
              contentUri: 'https://images.ctfassets.net/example/coffee.png',
            },
          },
        },
      },
    },
  },
  normalizedDocument: {
    documentId: 'doc-1',
    title: 'NRF Coffee Truck 2026',
    designValues: [],
    images: [],
    tables: [],
    assets: [],
    contentBlocks: [
      {
        id: 'block-1',
        position: 0,
        type: 'heading',
        headingLevel: 2,
        textRuns: [{ text: 'Conference', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-2',
        position: 1,
        type: 'paragraph',
        textRuns: [{ text: 'Normalized paragraph fallback.', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
      {
        id: 'block-3',
        position: 2,
        type: 'paragraph',
        textRuns: [{ text: 'Save main-character energy at NRF.', styles: {} }],
        designValueIds: [],
        imageIds: [],
      },
    ],
  },
  contentTables: [],
  referenceGraph: {
    nodes: [],
    edges: [],
    hasCircularDependency: false,
  },
  entryHierarchy: [
    {
      tempId: 'entry-event',
      entryIndex: 0,
      parentTempId: null,
      depth: 0,
      childTempIds: ['entry-resource'],
    },
    {
      tempId: 'entry-resource',
      entryIndex: 1,
      parentTempId: 'entry-event',
      depth: 1,
      childTempIds: [],
    },
  ],
  headingCorrections: 0,
  agentCorrections: 0,
  agentCorrectionDetails: [],
  contentTypes: [
    {
      sys: { id: 'eventDetailPage' },
      name: 'Event Detail Page',
      displayField: 'eventName',
      fields: [
        { id: 'eventType', name: 'Event type', type: 'Symbol', required: false },
        { id: 'eventDescription', name: 'Event description', type: 'Text', required: false },
        {
          id: 'eventQuickDescription',
          name: 'Event quick description',
          type: 'Text',
          required: false,
        },
      ],
    },
    {
      sys: { id: 'resourceDetailHero' },
      name: 'Resource detail hero',
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: false },
        { id: 'description', name: 'Description', type: 'Text', required: false },
      ],
    },
  ],
  mappingPlan: {
    entries: [
      {
        contentTypeId: 'eventDetailPage',
        tempId: 'entry-event',
        fieldMappings: [
          {
            fieldId: 'eventType',
            fieldType: 'Symbol',
            sourceBlockIds: ['block-1'],
            sourceTableIds: [],
            sourceAssetIds: [],
            sourceEntryIds: [],
            confidence: 0.9,
          },
          {
            fieldId: 'eventDescription',
            fieldType: 'Text',
            sourceBlockIds: ['block-2'],
            sourceTableIds: [],
            sourceAssetIds: [],
            sourceEntryIds: [],
            confidence: 0.86,
          },
        ],
      },
      {
        contentTypeId: 'resourceDetailHero',
        tempId: 'entry-resource',
        fieldMappings: [
          {
            fieldId: 'title',
            fieldType: 'Symbol',
            sourceBlockIds: ['block-1'],
            sourceTableIds: [],
            sourceAssetIds: [],
            sourceEntryIds: [],
            confidence: 0.75,
          },
        ],
      },
    ],
    unmappedBlockIds: ['block-3'],
    summary: '2 entries generated',
  },
  entries: [],
  assets: [],
};

describe('ReviewPage', () => {
  const mockSelection = (selectedText: string, anchorNode?: Node | null) => {
    const selection = {
      toString: () => selectedText,
      removeAllRanges: vi.fn(),
      anchorNode: anchorNode ?? null,
      focusNode: anchorNode ?? null,
    };

    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: () => selection,
    });

    return selection;
  };

  const selectTextInBlock = (blockName: string, selectedText: string, childSelector: string) => {
    const target = screen.getByRole('button', { name: blockName });
    const textNode = target.querySelector(childSelector)?.firstChild ?? target.firstChild;

    mockSelection(selectedText, textNode);

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
    });
  };

  it('renders the updated review layout and document outline styles', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    expect(
      screen.getByRole('heading', { name: 'Create from document "NRF Coffee Truck 2026"' })
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Review your document mappings' })).toBeNull();
    expect(
      screen.queryByText(
        'Verify how source content maps into each entry, then correct assignments inline.'
      )
    ).toBeNull();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Document outline' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Event Detail Page' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Resource detail hero' })).toBeTruthy();
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveStyle({ overflowX: 'auto' });
    expect(screen.getByRole('button', { name: 'Create selected entries (2)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page: Event Detail Page' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Component: Resource detail hero' })).toHaveStyle({
      marginLeft: '1.5rem',
    });
    expect(screen.queryByRole('heading', { name: 'NRF Coffee Truck 2026' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Document provenance' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Conference' })).toBeTruthy();
    expect(screen.getAllByText('Original raw doc paragraph.').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: 'Coffee image' })).toBeTruthy();
    expect(screen.getByText('Column A')).toBeTruthy();
    expect(screen.getByText('Column B')).toBeTruthy();
    expect(screen.queryByText('Normalized paragraph fallback.')).toBeNull();
    expect(screen.queryByText('Mapped to current entry')).toBeNull();
    expect(screen.queryByText('Mapped to another entry')).toBeNull();
    expect(screen.queryByText('Unassigned')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Selection actions' })).toBeNull();
    const conferenceBlock = screen.getByRole('button', { name: 'Conference' });
    const documentSurface = conferenceBlock.closest(
      'div[style*="padding: 1.5rem 2rem"]'
    ) as HTMLElement | null;
    expect(documentSurface).toHaveStyle({ border: '1px solid rgb(207, 217, 224)' });
  });

  it('shows selection actions for highlighted text and opens a modal to assign it', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    selectTextInBlock('Save main-character energy at NRF.', 'Save main-character energy', 'p');

    expect(screen.getByRole('button', { name: 'Assign' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Choose a destination' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));

    expect(screen.getByRole('heading', { name: 'Move content' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Entry' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Field' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Field' }), {
      target: { value: 'eventQuickDescription' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Move content' }));

    expect(screen.queryByRole('heading', { name: 'Move content' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();
    expect(screen.getAllByText('Save main-character energy').length).toBeGreaterThan(0);
  });

  it('shows all mapped destinations for multi-mapped content and supports reassigning it through the modal', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    selectTextInBlock('Conference', 'Conference', 'h3');

    expect(screen.getByText('Also used in 1 other field')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reassign' }));
    expect(screen.getByRole('heading', { name: 'Move content' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Field' }), {
      target: { value: 'eventQuickDescription' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Move content' }));

    expect(screen.queryByText('Move content')).toBeNull();
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();
  });

  it('keeps unmapped blocks visually neutral', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    const target = screen.getByRole('button', { name: /save main-character energy at nrf/i });
    expect(target).toHaveStyle({ background: 'rgb(255, 255, 255)' });
    expect(target).toHaveStyle({ borderColor: 'rgb(255, 255, 255)' });
  });

  it('switches to the linked entry when clicking a block mapped to another entry', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Resource detail hero' }));
    fireEvent.click(screen.getByRole('button', { name: 'Original raw doc paragraph.' }));

    expect(screen.getByRole('tab', { name: 'Event Detail Page' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('updates selection actions immediately when another text range is selected', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    selectTextInBlock('Conference', 'Conference', 'h3');
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();
    expect(screen.getByText('Also used in 1 other field')).toBeTruthy();

    selectTextInBlock('Save main-character energy at NRF.', 'Save main-character energy', 'p');

    expect(screen.getByRole('button', { name: 'Assign' })).toBeTruthy();
    expect(screen.queryByText('Also used in 1 other field')).toBeNull();
  });

  it('supports excluding a partial text selection and shows it in the reference tree', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    selectTextInBlock('Save main-character energy at NRF.', 'main-character energy', 'p');

    fireEvent.click(screen.getByRole('button', { name: 'Exclude' }));

    expect(screen.getAllByText('main-character energy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('main-character energy').length).toBeGreaterThan(0);
  });

  it('toggles entry checkboxes and lets overview cards switch the active tab', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    const resourceCheckbox = screen.getByRole('checkbox', {
      name: 'Select Component: Resource detail hero',
    });
    expect(resourceCheckbox).toBeChecked();

    fireEvent.click(resourceCheckbox);

    expect(resourceCheckbox).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Create selected entries (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Component: Resource detail hero' }));

    expect(screen.getByRole('tab', { name: 'Resource detail hero' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
