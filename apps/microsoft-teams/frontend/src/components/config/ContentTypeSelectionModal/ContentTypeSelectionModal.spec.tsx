import ContentTypeSelectionModal from './ContentTypeSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';
import { mockContentType } from '@test/mocks';
import { cloneDeep } from 'lodash';

describe('ContentTypeSelectionModal component', () => {
  it('mounts and renders the correct content', () => {
    const { unmount } = render(
      <ContentTypeSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedContentTypeId=""
        handleNotificationEdit={vi.fn()}
        contentTypes={[]}
        contentTypeConfigLink=""
        error={false}
      />
    );

    expect(screen.getByText(contentTypeSelection.modal.title)).toBeTruthy();
    unmount();
  });

  it('mounts and renders error content when error is present', () => {
    const { errorMessage } = contentTypeSelection.modal;
    const { unmount } = render(
      <ContentTypeSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedContentTypeId=""
        handleNotificationEdit={vi.fn()}
        contentTypes={[]}
        contentTypeConfigLink=""
        error={true}
      />
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
    unmount();
  });

  describe('selecting a content type', () => {
    it("clicking the entire row, selects the row's content type", () => {
      const notificationEditSpy = vi.fn();

      const { unmount } = render(
        <ContentTypeSelectionModal
          isShown={true}
          onClose={vi.fn()}
          savedContentTypeId=""
          handleNotificationEdit={notificationEditSpy}
          contentTypes={[mockContentType]}
          contentTypeConfigLink=""
          error={false}
        />
      );

      const row = screen.getByText(mockContentType.name).closest('tr');
      fireEvent.click(row as Element);

      // verify that radio button is checked
      const radioBtn = screen.getByRole('radio') as HTMLInputElement;
      expect(radioBtn.checked).toEqual(true);

      // submit form
      const submitBtn = screen.getByRole('button', { name: 'Select' });
      fireEvent.click(submitBtn);

      // ensure that notificationEdit() was called with correct value
      expect(notificationEditSpy).toHaveBeenCalledTimes(1);

      // todo: move this to a before/after block.  Ideally an after
      vi.restoreAllMocks();
      unmount();
    });
  });

  describe('searching for a content type', () => {
    it('fuzzy searches the list of content types', () => {
      const blogContentType = cloneDeep(mockContentType);
      blogContentType.displayField = 'Xyz Asdf 78AUB';
      blogContentType.name = 'xyz Asdf 78aub';
      blogContentType.sys.id = 'xyzAsdf8aub';

      const multipleContentTypes = [mockContentType, blogContentType];

      const { unmount } = render(
        <ContentTypeSelectionModal
          isShown={true}
          onClose={vi.fn()}
          savedContentTypeId=""
          handleNotificationEdit={vi.fn()}
          contentTypes={multipleContentTypes}
          contentTypeConfigLink=""
          error={false}
        />
      );

      const searchInput = screen.getByPlaceholderText(contentTypeSelection.modal.searchPlaceholder);

      // Search for Blog
      act(() => fireEvent.change(searchInput, { target: { value: 'XYZ_asdf-89uab' } })); // case-insensitive & misspelled to trigger fuzzy
      const searchResults = screen.getAllByRole('radio');

      // assert Blog results were returned
      waitFor(() => {
        expect(searchResults.length).toEqual(1);
        const blogContentTypeResult = screen.getByText('Blog Asdf');
        expect(blogContentTypeResult).toBeDefined();
      });

      // clear search params
      act(() => fireEvent.change(searchInput, { target: { value: '' } }));
      waitFor(() => expect(searchResults.length).toEqual(2));

      unmount();
    });
  });
});
