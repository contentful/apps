import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList';
import { mockContentTypes } from '@test/mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '@test/mocks/mockContentTypePreviewPathSelections';

describe('ContentTypePreviewPathSelectionList', () => {
  it('renders list of selections', () => {
    const { unmount } = render(
      <ContentTypePreviewPathSelectionList
        contentTypes={mockContentTypes}
        contentTypePreviewPathSelections={mockContentTypePreviewPathSelections}
        dispatch={() => null}
      />
    );

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
    const { unmount } = render(
      <ContentTypePreviewPathSelectionList
        contentTypes={mockContentTypes}
        contentTypePreviewPathSelections={[
          ...mockContentTypePreviewPathSelections,
          { contentType: 'article', previewPath: 'test-article-path' },
        ]}
        dispatch={() => null}
      />
    );

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
});
