import ContentTypeSelectionModal from './ContentTypeSelectionModal';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { contentTypeSelection } from '@constants/configCopy';

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
        error={false}
      />
    );

    expect(screen.getByText(contentTypeSelection.modal.title)).toBeTruthy();
  });

  it('mounts and renders error content when error is present', () => {
    const { errorMessage } = contentTypeSelection.modal;
    render(
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
  });
});
