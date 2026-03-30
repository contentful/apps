import Page from '../../../src/locations/Page/Page';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../mocks';
import { vi, describe, it, expect, afterEach } from 'vitest';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../../src/locations/Page/components/mainpage/OAuthConnector', () => ({
  OAuthConnector: () => <div>Mock OAuth Connector</div>,
}));

const { mockModalOrchestrator } = vi.hoisted(() => ({
  mockModalOrchestrator: vi.fn(),
}));

vi.mock('../../../src/locations/Page/components/mainpage/ModalOrchestrator', () => ({
  ModalOrchestrator: require('react').forwardRef(
    (
      props: {
        onPreviewReady: (payload: { documentTitle: string; data: Record<string, unknown> }) => void;
        onResetToMain: () => void;
        oauthToken: string;
      },
      ref: React.ForwardedRef<{ startFlow: () => void }>
    ) => {
      const handle = { startFlow: vi.fn() };
      if (typeof ref === 'function') {
        ref(handle);
      } else if (ref) {
        ref.current = handle;
      }

      mockModalOrchestrator(props);
      return (
        <>
          <button
            onClick={() =>
              props.onPreviewReady({
                documentTitle: 'Document from workflow',
                data: {},
              })
            }
            type="button">
            Trigger Preview Ready
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

  it('renders MainPageView by default', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document":/)).toBeNull();
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

  it('returns to main view when preview is canceled', async () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Preview Ready' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel preview' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel preview' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Drive Integration' })).toBeTruthy();
      expect(screen.queryByText(/Create from document "Selected document":/)).toBeNull();
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
      expect(screen.queryByText(/Create from document "Selected document":/)).toBeNull();
    });
  });
});
