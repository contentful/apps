import { ContentType } from '@contentful/app-sdk';
import { PlusIcon } from '@contentful/f36-icons';
import { Button } from '@contentful/f36-components';
import { useState, Dispatch } from 'react';

import { ParameterAction, actions } from '@components/parameterReducer';
import { ContentTypePreviewPathSelection } from '@customTypes/configPage';
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
  const [addRow, setAddRow] = useState<number[]>([]);

  const filterContentTypes = getAvailableContentTypes(
    contentTypes,
    contentTypePreviewPathSelections
  );

  const handleUpdateParameters = (parameters: ContentTypePreviewPathSelection) => {
    if (parameters.contentType && parameters.previewPath) {
      if (addRow.length) setAddRow([]);
      dispatch({
        type: actions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
        payload: parameters,
      });
    }
  };

  const handleRemoveRow = (parameters: ContentTypePreviewPathSelection) => {
    if (addRow.length) setAddRow([]);

    dispatch({
      type: actions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  // TO DO: Adjust AddRow logic to boolean if we want to enforce only one row appearing at once
  const handleAddRow = () => {
    setAddRow([...addRow, addRow.length]);
  };

  // render add button if there are content types that are not selected
  const renderAddButton = contentTypePreviewPathSelections.length !== contentTypes.length;
  // disable add button if there is a row with empty fields present
  const isAddButtonDisabled = !!addRow.length || contentTypePreviewPathSelections.length === 0;

  const renderSelectionRow = () => {
    // TO DO: Handle case where contentTypes are not present - do not render add button etc.
    if (!contentTypes?.length) return;
    if (!contentTypePreviewPathSelections?.length) {
      return (
        <ContentTypePreviewPathSelectionRow
          contentTypes={filterContentTypes()}
          onParameterUpdate={handleUpdateParameters}
          onRemoveRow={handleRemoveRow}
          renderLabel
        />
      );
    }
    return contentTypePreviewPathSelections.map((contentTypePreviewPathSelection, index) => (
      <ContentTypePreviewPathSelectionRow
        key={contentTypePreviewPathSelection.previewPath}
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

      {addRow.map((row) => (
        <ContentTypePreviewPathSelectionRow
          key={row}
          contentTypes={filterContentTypes()}
          onParameterUpdate={handleUpdateParameters}
          onRemoveRow={handleRemoveRow}
        />
      ))}

      {renderAddButton && (
        <Button isDisabled={isAddButtonDisabled} onClick={handleAddRow} startIcon={<PlusIcon />}>
          Add Content Type
        </Button>
      )}
    </>
  );
};
