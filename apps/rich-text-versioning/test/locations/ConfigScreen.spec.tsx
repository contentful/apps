import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { OnConfigureHandlerReturn } from '@contentful/app-sdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

async function saveAppInstallation() {
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
}

describe('Config Screen component', () => {
  beforeAll(() => {
    // Set up mock data
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: [
        {
          sys: { id: 'blog-post' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'content', name: 'Content', type: 'RichText' },
          ],
        },
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [
            { id: 'title', name: 'Title', type: 'Text' },
            { id: 'body', name: 'Body', type: 'RichText' },
          ],
        },
      ],
      total: 2,
    });

    mockSdk.cma.contentType.get.mockResolvedValue({
      sys: { id: 'test-content-type' },
      name: 'Test Content Type',
      fields: [
        { id: 'title', name: 'Title', type: 'Text' },
        { id: 'content', name: 'Content', type: 'RichText' },
      ],
    });

    mockSdk.hostnames = { delivery: 'cdn.contentful.com' };
    mockSdk.notifier = {
      error: vi.fn(),
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSdk.app.getParameters.mockResolvedValue({});
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.onConfigure.mockImplementation(
      (callback: () => Promise<OnConfigureHandlerReturn>) => {
        mockSdk.app.onConfigureCallback = callback;
      }
    );
  });

  it('should display the main heading and description', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Set up Rich Text Versioning')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This app allows content creators to visually compare changes in a rich text field against the last published version/
      )
    ).toBeInTheDocument();
  });

  it('should display the rich text fields multiselect', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });

    expect(screen.getByText('Rich text fields')).toBeInTheDocument();
    expect(screen.getByText('Select one or more')).toBeInTheDocument();
  });

  it('should reset content types when none are selected', async () => {
    // Mock current state with existing app configuration
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        'existing-content-type': {
          controls: [{ fieldId: 'content' }],
        },
      },
    });

    await act(async () => {
      render(<ConfigScreen />);
    });

    // Simulate configuration with no content types selected
    await act(async () => {
      const result = await saveAppInstallation();

      // Verify that the target state has an empty EditorInterface
      // This means the app is removed from all content types
      expect(result).toBeDefined();
      expect(result.targetState).toBeDefined();
      expect(result.targetState.EditorInterface).toEqual({});
    });
  });
});
