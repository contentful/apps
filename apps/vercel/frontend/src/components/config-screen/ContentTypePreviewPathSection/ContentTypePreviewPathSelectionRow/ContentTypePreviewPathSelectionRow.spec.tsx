import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentTypePreviewPathSelectionRow } from './ContentTypePreviewPathSelectionRow';
import { mockContentTypes } from '@test/mocks/mockContentTypes';
import { copies } from '@constants/copies';
import { renderConfigPageComponent } from '@test/helpers/renderConfigPageComponent';
import { errorMessages } from '@constants/errorMessages';
import lodash from 'lodash';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const { inputs } = copies.configPage.contentTypePreviewPathSection;

const selection = { contentType: 'blog', previewPath: 'test-blog-path-1' };

describe('ContentTypePreviewPathSelectionRow', () => {
  it('calls handler to update parameters when each input is provided', () => {
    const mockOnUpdate = vi.fn();
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={mockOnUpdate}
        onRemoveRow={() => null}
        rowId={0}
      />
    );

    const select = document.querySelector('select');
    fireEvent.change(select!, { target: { value: mockContentTypes[0].sys.id } });

    expect(mockOnUpdate).toHaveBeenCalled();

    const previewPathInput = screen.getByPlaceholderText(inputs.previewPath.placeholder);
    fireEvent.change(previewPathInput, { target: { value: 'test-path' } });

    expect(mockOnUpdate).toHaveBeenCalled();
    unmount();
  });

  it('calls handler to remove row when remove button is clicked', () => {
    const mockOnRemoveRow = vi.fn();
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={() => null}
        onRemoveRow={mockOnRemoveRow}
        configuredContentTypePreviewPathSelection={selection}
        rowId={0}
      />
    );

    const removeButton = screen.getAllByRole('button', { name: 'Delete row' });
    removeButton[0].click();

    expect(mockOnRemoveRow).toHaveBeenCalledOnce();
    unmount();
  });

  it('renders selection row without configured selections provided', () => {
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={() => null}
        onRemoveRow={() => null}
        rowId={0}
      />
    );

    expect(screen.getByText(inputs.contentType.placeholder)).toBeTruthy();
    expect(screen.getByPlaceholderText(inputs.previewPath.placeholder)).toBeTruthy();
    unmount();
  });

  it('renders selection row with configured selection provided', () => {
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={() => null}
        onRemoveRow={() => null}
        configuredContentTypePreviewPathSelection={selection}
        rowId={0}
      />
    );

    expect(screen.getByDisplayValue(selection.previewPath)).toBeTruthy();
    unmount();
  });

  it('renders message when no content types exist', () => {
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={[]}
        onParameterUpdate={() => null}
        onRemoveRow={() => null}
        configuredContentTypePreviewPathSelection={selection}
        rowId={0}
      />
    );

    expect(screen.getByText(inputs.contentType.emptyMessage)).toBeTruthy();
    unmount();
  });

  it('renders message when preview path is empty and user has saved config', () => {
    vi.spyOn(lodash, 'pickBy').mockReturnValue({
      contentType: 'blog',
      emptyPreviewPathInput: true,
    });
    const selection = { contentType: 'blog', previewPath: '' };
    const errors = {
      previewPathSelection: [
        {
          contentType: selection.contentType,
          invalidPreviewPathFormat: false,
          emptyPreviewPathInput: true,
        },
      ],
    };
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={vi.fn()}
        onRemoveRow={() => null}
        configuredContentTypePreviewPathSelection={selection}
        rowId={0}
      />,
      { isAppConfigurationSaved: true, errors }
    );

    expect(screen.getByText(errorMessages.emptyPreviewPathInput)).toBeTruthy();
    unmount();
  });

  it('renders error message when preview path is invalid and user has saved config', () => {
    vi.spyOn(lodash, 'pickBy').mockReturnValue({
      contentType: 'blog',
      invalidPreviewPathFormat: true,
    });
    const errors = {
      previewPathSelection: [
        {
          contentType: selection.contentType,
          invalidPreviewPathFormat: true,
          emptyPreviewPathInput: false,
        },
      ],
    };
    const { unmount } = renderConfigPageComponent(
      <ContentTypePreviewPathSelectionRow
        contentTypes={mockContentTypes}
        onParameterUpdate={vi.fn()}
        onRemoveRow={() => null}
        configuredContentTypePreviewPathSelection={selection}
        rowId={0}
      />,
      { isAppConfigurationSaved: true, errors }
    );

    expect(screen.getByText(errorMessages.invalidPreviewPathFormat)).toBeTruthy();
    unmount();
  });
});
