import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../mocks';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import React from 'react';
import type { MappingReviewSuspendPayload } from '@types';
import Page from '../../../src/locations/Page/Page';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders MainPageView by default', async () => {
    render(<Page />);

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

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));
    await waitFor(() => {
      expect(screen.getByText('Create from document "Document mapping review"')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Reset To Main' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document"/)).toBeNull();
    });
  });

  it('switches to the mapping review screen when the workflow pauses for mapping review', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Mapping Review Ready' }));

    await waitFor(() => {
      expect(screen.getByText('Create from document "Document mapping review"')).toBeTruthy();
      expect(screen.getByText('Mock fixture review')).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Drive Integration' })).toBeNull();
    });
  });
});
