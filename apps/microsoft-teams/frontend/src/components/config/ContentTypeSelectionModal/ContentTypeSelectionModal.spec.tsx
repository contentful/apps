import ContentTypeSelectionModal from './ContentTypeSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';
import { mockContentType } from '@test/mocks';

describe('ContentTypeSelectionModal component', () => {
  it('mounts and renders the correct content', () => {
    render(
      <ContentTypeSelectionModal
        isShown={true}
        onClose={vi.fn()}
        savedContentTypeId=""
        handleNotificationEdit={vi.fn()}
        contentTypes={[]}
        contentTypeConfigLink=""
      />
    );

    expect(screen.getByText(contentTypeSelection.modal.title)).toBeTruthy();
  });

  describe('selecting a content type', () => {
    it('clicking the entire row, selects the row\'s content type', () => {
      const notificationEditSpy = vi.fn();

      render(
        <ContentTypeSelectionModal
          isShown={true}
          onClose={vi.fn()}
          savedContentTypeId=""
          handleNotificationEdit={notificationEditSpy}
          contentTypes={[mockContentType]}
          contentTypeConfigLink=""
        />
      );

      const row = screen.getByText(mockContentType.name).closest('tr')
      fireEvent.click(row as Element);

      // verify that radio button is checked
      const radioBtn = screen.getByRole('radio') as HTMLInputElement;
      expect(radioBtn.checked).toEqual(true)

      // submit form
      const submitBtn = screen.getByRole('button', { name: 'Select' })
      fireEvent.click(submitBtn);

      // ensure that notificationEdit() was called with correct value
      expect(notificationEditSpy).toHaveBeenCalledTimes(1);

      // todo: move this to a before/after block.  Ideally an after
      vi.restoreAllMocks();
    })
  })
});
