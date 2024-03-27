import { ContentType } from '@contentful/app-sdk';
import { PlusIcon } from '@contentful/f36-icons';
import { Button } from '@contentful/f36-components';
import { useState, Dispatch, SetStateAction } from 'react';

import { ContentTypePreviewPathSelectionRow } from '../ContentTypePreviewPathSelectionRow/ContentTypePreviewPathSelectionRow';
import { ContentTypePreviewPathSelection } from '../../../../types';
import { actions } from '../../../parameterReducer';

interface Props {
  contentTypes: ContentType[];
  dispatchParameters: Dispatch<SetStateAction<any>>;
  contentTypePreviewPathSelections: ContentTypePreviewPathSelection[];
}

export const ContentTypePreviewPathSelectionList: React.FC<Props> = ({
  contentTypes,
  dispatchParameters,
  contentTypePreviewPathSelections = [],
}) => {
  const [addRow, setAddRow] = useState<number[]>([]);

  const handleUpdateParameters = (parameters: ContentTypePreviewPathSelection) => {
    if (parameters.contentType && parameters.previewPath) {
      if (addRow.length) setAddRow([]);
      dispatchParameters({
        type: actions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
        payload: parameters,
      });
    }
  };

  const handleRemoveRow = (parameters: ContentTypePreviewPathSelection) => {
    if (addRow.length) setAddRow([]);

    dispatchParameters({
      type: actions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  // TO DO: Adjust AddRow logic to boolean if we want to enforce only one row appearing at once
  const handleAddRow = () => {
    setAddRow([...addRow, addRow.length]);
  };

  const isAddButtonDisabled =
    Boolean(addRow.length) || !Boolean(contentTypePreviewPathSelections.length);

  const renderSelectionRow = () => {
    // TO DO: Handle case where contentTypes are not present - do not render add button etc.
    if (!contentTypes?.length) return;
    if (!contentTypePreviewPathSelections?.length) {
      return (
        <ContentTypePreviewPathSelectionRow
          contentTypes={contentTypes}
          onParameterUpdate={handleUpdateParameters}
          onRemoveRow={handleRemoveRow}
          renderLabel
        />
      );
    }
    return contentTypePreviewPathSelections.map((contentTypePreviewPathSelection, index) => (
      <ContentTypePreviewPathSelectionRow
        key={index}
        configuredContentTypePreviewPathSelection={contentTypePreviewPathSelection}
        contentTypes={contentTypes}
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
          contentTypes={contentTypes}
          onParameterUpdate={handleUpdateParameters}
          onRemoveRow={handleRemoveRow}
        />
      ))}

      <Button isDisabled={isAddButtonDisabled} onClick={handleAddRow} startIcon={<PlusIcon />}>
        Add Content Type
      </Button>
    </>
  );
};
