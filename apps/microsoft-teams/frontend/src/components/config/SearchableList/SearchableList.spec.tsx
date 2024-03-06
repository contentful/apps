import SearchableList from './SearchableList';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ContentTypeSelectionModal component', () => {
  it('mounts and renders a list of items', () => {
    const list = ['asdf', 'bsdf'];
    const renderListItem = vi.fn().mockImplementation((item, idx) => <p key={idx}>{item}</p>);
    const { unmount } = render(
      <SearchableList list={list} searchQuery="" renderListItem={renderListItem} searchKeys={[]} />
    );

    const listItem1 = screen.getByText(list[0]);
    const listItem2 = screen.getByText(list[1]);

    expect(listItem1).toBeTruthy();
    expect(listItem2).toBeTruthy();
    expect(renderListItem).toHaveBeenCalledTimes(2);

    unmount();
  });

  describe('searching for a content type', () => {
    it('fuzzy searches for content types', () => {
      const list = ['videos', 'blog posts', 'tutorials'];
      const searchQuery = 'Blgo-Potts'; // intentionally misspelled to trigger fuzzy search
      const renderListItem = vi.fn().mockImplementation((item, idx) => <p key={idx}>{item}</p>);
      const { unmount } = render(
        <SearchableList
          list={list}
          searchQuery={searchQuery}
          renderListItem={renderListItem}
          searchKeys={[]}
        />
      );

      const videos = screen.queryByText(list[0]);
      const blogPosts = screen.queryByText(list[1]);
      const tutorials = screen.queryByText(list[2]);

      expect(blogPosts).toBeTruthy();
      expect(videos).toBeFalsy();
      expect(tutorials).toBeFalsy();

      unmount();
    });
  });
});
