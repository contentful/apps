import { ContentType } from '@contentful/app-sdk';
import { PlusIcon } from '@contentful/f36-icons';
import { Button } from '@contentful/f36-components';
import { useState, Dispatch } from 'react';

import { ParameterAction, actions } from '@components/parameterReducer';
import {
  ApplyContentTypePreviewPathSelectionPayload,
  ContentTypePreviewPathSelection,
} from '@customTypes/configPage';
import { ContentTypePreviewPathSelectionRow } from '../ContentTypePreviewPathSelectionRow/ContentTypePreviewPathSelectionRow';
import { getAvailableContentTypes } from '@utils/getAvailableContentTypes';

interface Props {
  contentTypes: ContentType[];
  dispatch: Dispatch<ParameterAction>;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
}

export const ContentTypePreviewPathSelectionList = ({
  contentTypes,
  dispatch,
  contentTypePreviewPathSelections = [],
}: Props) => {
  const [addRow, setAddRow] = useState<boolean>(false);

  const filterContentTypes = getAvailableContentTypes(
    contentTypes,
    contentTypePreviewPathSelections
  );

  const handleUpdateParameters = (parameters: ApplyContentTypePreviewPathSelectionPayload) => {
    if (addRow) setAddRow(false);
    dispatch({
      type: actions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  const handleRemoveRow = (parameters: ContentTypePreviewPathSelection) => {
    if (addRow) setAddRow(false);

    dispatch({
      type: actions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  const handleAddRow = () => {
    setAddRow(true);
  };

  // render add button if there are content types that are not selected
  const renderAddButton = contentTypePreviewPathSelections.length !== contentTypes.length;
  // disable add button if there is a row with empty fields present
  const isAddButtonDisabled = addRow || contentTypePreviewPathSelections.length === 0;

  const renderSelectionRow = () => {
    const selectionsWithBlankRow =
      addRow || !contentTypePreviewPathSelections?.length
        ? contentTypePreviewPathSelections.concat({ contentType: '', previewPath: '' })
        : contentTypePreviewPathSelections;

    // TO DO: Handle case where contentTypes are not present - do not render add button etc.
    if (!contentTypes?.length) return;

    return selectionsWithBlankRow.map((contentTypePreviewPathSelection, index) => (
      <ContentTypePreviewPathSelectionRow
        key={contentTypePreviewPathSelection.contentType}
        configuredContentTypePreviewPathSelection={contentTypePreviewPathSelection}
        contentTypes={filterContentTypes(contentTypePreviewPathSelection.contentType)}
        onParameterUpdate={handleUpdateParameters}
        onRemoveRow={handleRemoveRow}
        renderLabel={index === 0}
      />
    ));
  };

  return (
    <>
      {renderSelectionRow()}

      {renderAddButton && (
        <Button isDisabled={isAddButtonDisabled} onClick={handleAddRow} startIcon={<PlusIcon />}>
          Add Content Type
        </Button>
      )}
    </>
  );
};
