import SearchableList from './SearchableList';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ContentTypeSelectionModal component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts and renders a list of items', () => {
    const items = ['asdf', 'bsdf'];
    const renderListItem = vi.fn().mockImplementation((item, idx) => <p key={idx}>{item}</p>);
    const { unmount } = render(
      <SearchableList
        items={items}
        searchQuery=""
        renderListItem={renderListItem}
        searchKeys={[]}
      />
    );

    const listItem1 = screen.getByText(items[0]);
    const listItem2 = screen.getByText(items[1]);

    expect(listItem1).toBeTruthy();
    expect(listItem2).toBeTruthy();
    expect(renderListItem).toHaveBeenCalledWith('asdf');
    expect(renderListItem).toHaveBeenCalledWith('bsdf');

    unmount();
  });

  describe('searching for a content type', () => {
    it('fuzzy searches for content types', () => {
      const items = ['videos', 'blog posts', 'tutorials'];
      const searchQuery = 'Blgo-Potts'; // intentionally misspelled to trigger fuzzy search
      const renderListItem = vi.fn().mockImplementation((item, idx) => <p key={idx}>{item}</p>);
      const { unmount } = render(
        <SearchableList
          items={items}
          searchQuery={searchQuery}
          renderListItem={renderListItem}
          searchKeys={[]}
        />
      );

      const videos = screen.queryByText(items[0]);
      const blogPosts = screen.queryByText(items[1]);
      const tutorials = screen.queryByText(items[2]);

      expect(blogPosts).toBeTruthy();
      expect(videos).toBeFalsy();
      expect(tutorials).toBeFalsy();

      unmount();
    });
  });

  describe('optional pinnedItems prop', () => {
    it('"pins" the items to the top of the filtered list, so that they are always rendered, even if the fuzzy search did not match them', () => {
      const renderListItem = vi.fn().mockImplementation((item, idx) => (
        <p data-testid="car-item" key={idx}>
          {item.title}
        </p>
      ));

      const car1 = {
        id: 123,
        title: 'A brand new car! Gotta love that "new car" smell!',
      };
      const car2 = {
        id: 456,
        title: 'A slightly used car! Fuel efficient and experienced!',
      };
      const items = [car1, car2];

      const { unmount } = render(
        <SearchableList
          items={items}
          searchQuery={car2.title} // fuzzy search match ONLY car 2
          renderListItem={renderListItem}
          searchKeys={['title']}
          pinnedItems={[car1]} // Pin car 1 to top
        />
      );

      const renderedCarsList = screen.getAllByTestId('car-item');

      // assert both cars were rendered, and the pinned one appears first.
      expect(renderedCarsList.length).toEqual(2);
      expect(renderedCarsList[0].textContent).toEqual(car1.title);
      expect(renderedCarsList[1].textContent).toEqual(car2.title);

      unmount();
    });
  });
});
