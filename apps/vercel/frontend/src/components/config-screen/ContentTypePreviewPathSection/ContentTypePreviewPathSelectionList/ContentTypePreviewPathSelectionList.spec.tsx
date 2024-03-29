import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentType } from '@contentful/app-sdk';
import { ContentTypePreviewPathSelectionList } from './ContentTypePreviewPathSelectionList';

describe('ContentTypePreviewPathSelectionList', () => {
  it('renders list of selections', () => {
    const selections = [
      { contentType: 'blog', previewPath: 'test-blog-path' },
      { contentType: 'news', previewPath: 'test-news-path' },
    ];
    render(
      <ContentTypePreviewPathSelectionList
        contentTypes={
          [
            { name: 'blog', sys: { id: '12' } },
            { name: 'news', sys: { id: '13' } },
          ] as ContentType[]
        }
        contentTypePreviewPathSelections={selections}
        dispatch={() => null}
      />
    );

    expect(screen.getAllByText(selections[0].contentType)).toBeTruthy();
    expect(screen.getByDisplayValue(selections[0].previewPath)).toBeTruthy();
    expect(screen.getAllByText(selections[1].contentType)).toBeTruthy();
    expect(screen.getByDisplayValue(selections[1].previewPath)).toBeTruthy();
  });
});
