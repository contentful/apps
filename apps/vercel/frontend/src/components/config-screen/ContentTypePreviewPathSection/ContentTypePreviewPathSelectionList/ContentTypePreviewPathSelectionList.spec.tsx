import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList';
import { mockContentTypePreviewPathSelections } from '@test/mocks/mockContentTypePreviewPathSelections';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { AppInstallationParameters } from '@customTypes/configPage';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ContentTypePreviewPathSelectionList', () => {
  it('renders list of selections', () => {
    const { unmount } = renderConfigPageComponent(<ContentTypePreviewPathSelectionList />);

    expect(screen.getAllByText('Blog')).toBeTruthy();
    expect(
      screen.getByDisplayValue(mockContentTypePreviewPathSelections[0].previewPath)
    ).toBeTruthy();
    expect(screen.getAllByText('News')).toBeTruthy();
    expect(
      screen.getByDisplayValue(mockContentTypePreviewPathSelections[1].previewPath)
    ).toBeTruthy();
    expect(screen.getByText('Add Content Type')).toBeTruthy();

    unmount();
  });

  it('disables add button if all content types have been configured', () => {
    const contentTypePreviewPathSelections = [
      ...mockContentTypePreviewPathSelections,
      { contentType: 'article', previewPath: 'test-article-path' },
    ];
    const { unmount } = renderConfigPageComponent(<ContentTypePreviewPathSelectionList />, {
      parameters: { contentTypePreviewPathSelections } as unknown as AppInstallationParameters,
    });

    expect(screen.getAllByText('Blog')).toBeTruthy();
    expect(
      screen.getByDisplayValue(mockContentTypePreviewPathSelections[0].previewPath)
    ).toBeTruthy();
    expect(screen.getAllByText('News')).toBeTruthy();
    expect(
      screen.getByDisplayValue(mockContentTypePreviewPathSelections[1].previewPath)
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Content Type' })).toHaveProperty(
      'disabled',
      true
    );

    unmount();
  });

  it('disables add button if no content types exist', () => {
    const { unmount } = renderConfigPageComponent(<ContentTypePreviewPathSelectionList />, {
      parameters: {
        contentTypePreviewPathSelections: mockContentTypePreviewPathSelections,
      } as unknown as AppInstallationParameters,
      contentTypes: [],
    });

    expect(screen.getByRole('button', { name: 'Add Content Type' })).toHaveProperty(
      'disabled',
      true
    );

    unmount();
  });
});
