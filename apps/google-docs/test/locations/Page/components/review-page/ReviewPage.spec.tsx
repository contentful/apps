import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReviewPage } from '../../../../../src/locations/Page/components/review-page/ReviewPage';
import { ReviewPayload } from '../../../../../src/utils/types';

const reviewPayload: ReviewPayload = {
  documentTitle: 'NRF Coffee Truck 2026',
  reviewSummary: 'Review completed',
  summary: '2 mapped blocks, 1 unmapped block',
  unmappedBlockIds: ['block-3'],
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
        textRuns: [{ text: 'Hot coffee, hustle content, on us.', styles: {} }],
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
  it('renders entry tabs, mapping filters, and field occupancy for the selected entry', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    expect(screen.getByRole('heading', { name: 'Review your document mappings' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Event Detail Page' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Resource detail hero' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Current entry' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByText('Event quick description').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Empty').length).toBeGreaterThan(0);
    expect(screen.getByText('Also used in 1 other field')).toBeTruthy();
  });

  it('shows assign actions for unassigned blocks and updates the target field inline', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    fireEvent.click(screen.getByRole('button', { name: 'Unassigned' }));
    fireEvent.click(screen.getByRole('button', { name: /save main-character energy at nrf/i }));

    expect(screen.getByRole('button', { name: 'Assign' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));

    expect(screen.getByText('Choose a destination')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: /assign to event detail page event quick description/i,
      })
    );

    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();
    expect(screen.getByText('Mapped to current entry')).toBeTruthy();
    expect(screen.getAllByText('Save main-character energy at NRF.').length).toBeGreaterThan(0);
  });

  it('shows all mapped destinations for multi-mapped content and supports reassigning it', () => {
    render(<ReviewPage reviewPayload={reviewPayload} />);

    fireEvent.click(screen.getByRole('button', { name: /conference/i }));

    expect(screen.getByText('Used in 2 destinations')).toBeTruthy();
    expect(screen.getAllByText('Event type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Title').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reassign' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: /move to event detail page event quick description/i,
      })
    );

    expect(screen.getByText('Used in 1 destination')).toBeTruthy();
    expect(screen.getAllByText('Event quick description').length).toBeGreaterThan(0);
    expect(screen.queryByText('Title')).toBeNull();
  });
});
