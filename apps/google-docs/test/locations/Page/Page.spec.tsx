import Page from '../../../src/locations/Page/Page';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../mocks';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import React from 'react';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';

const previewPayloadMock: PreviewPayload = {
  entries: [],
  assets: [],
  referenceGraph: {},
  normalizedDocument: {
    documentId: 'doc-test',
    title: 'Document from workflow',
    contentBlocks: [],
    tables: [],
  },
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
};

const mappingReviewPayloadMock: MappingReviewSuspendPayload = {
  suspendStepId: 'mapping-review',
  reason: 'Mapping review required before CMA payload generation continues',
  documentId: 'doc-test',
  documentTitle: 'Document mapping review',
  normalizedDocument: {
    documentId: 'doc-test',
    title: 'Document mapping review',
    designValues: [],
    contentBlocks: [],
    images: [],
    tables: [],
    assets: [],
  },
  entryBlockGraph: {
    entries: [],
    excludedSourceRefs: [],
  },
  referenceGraph: {
    edges: [],
    creationOrder: [],
    deferredFields: [],
    hasCircularDependency: false,
  },
  contentTypes: [],
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: () => <div>Mock OAuth Connector</div>,
}));

vi.mock('../../../src/locations/Page/components/review/mapping/MappingView', () => ({
  MappingView: () => <div>Mock fixture review</div>,
}));

const { mockModalOrchestrator } = vi.hoisted(() => ({
  mockModalOrchestrator: vi.fn(),
}));

vi.mock('../../../src/locations/Page/components/mainpage/ModalOrchestrator', () => ({
  ModalOrchestrator: require('react').forwardRef(
    (
      props: {
        onPreviewReady: (payload: PreviewPayload) => void;
        onMappingReviewReady: (payload: MappingReviewSuspendPayload) => void;
        onResetToMain: () => void;
        oauthToken: string;
      },
      ref: React.ForwardedRef<{
        startFlow: () => void;
      }>
    ) => {
      const handle = {
        startFlow: vi.fn(),
      };
      if (typeof ref === 'function') {
        ref(handle);
      } else if (ref) {
        ref.current = handle;
      }

      mockModalOrchestrator(props);
      return (
        <>
          <button onClick={() => props.onPreviewReady(previewPayloadMock)} type="button">
            Trigger Preview Ready
          </button>
          <button
            onClick={() => props.onMappingReviewReady(mappingReviewPayloadMock)}
            type="button">
            Trigger Mapping Review Ready
          </button>
          <button onClick={props.onResetToMain} type="button">
            Trigger Reset To Main
          </button>
        </>
      );
    }
  ),
}));

describe('Page component', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {});

  it('renders MainPageView by default', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('switches to preview view when preview is ready', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Preview Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Create from document "Document from workflow"')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Drive Integration' })).toBeNull();
    });
  });

  it('returns to main view when preview cancel is confirmed', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Preview Ready' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel preview' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('returns to main view when flow reset is requested by modal orchestrator', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Preview Ready' }));
    await waitFor(() => {
      expect(screen.getByText('Create from document "Document from workflow"')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Reset To Main' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('switches to the fixture review screen from the main page', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Mock from fixture' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Review document "Pinterest Business Site Brief_Pinterest Top of Search ads"'
        )
      ).toBeTruthy();
      expect(screen.getByText('Mock fixture review')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Drive Integration' })).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: "You're about to lose your progress" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel without creating' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText('Mock fixture review')).toBeNull();
    });
  });

  it('switches to the mapping review screen when the workflow pauses for mapping review', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Review document "Document mapping review"')).toBeTruthy();
      expect(screen.getByText('Mock fixture review')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Drive Integration' })).toBeNull();
    });
  });
});
