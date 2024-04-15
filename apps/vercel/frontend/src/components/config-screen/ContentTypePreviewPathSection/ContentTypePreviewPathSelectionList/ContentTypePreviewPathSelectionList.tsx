import { PlusIcon } from '@contentful/f36-icons';
import { Button, Tooltip } from '@contentful/f36-components';
import { useState, useContext } from 'react';

import {
  ApplyContentTypePreviewPathSelectionPayload,
  ContentTypePreviewPathSelection,
} from '@customTypes/configPage';
import { ContentTypePreviewPathSelectionRow } from '../ContentTypePreviewPathSelectionRow/ContentTypePreviewPathSelectionRow';
import { getAvailableContentTypes } from '@utils/getAvailableContentTypes';
import { actions } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { copies } from '@constants/copies';

export const ContentTypePreviewPathSelectionList = () => {
  const [addRow, setAddRow] = useState<boolean>(false);

  const { dispatch, parameters, contentTypes } = useContext(ConfigPageContext);
  const { contentTypePreviewPathSelections } = parameters;

  const { button } = copies.configPage.contentTypePreviewPathSection;

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

  // disable add button if there is a row with empty fields present, when all content types are already selected, or no content types exist
  const isAddButtonDisabled =
    addRow ||
    contentTypePreviewPathSelections.length === 0 ||
    contentTypePreviewPathSelections.length === contentTypes.length ||
    contentTypes.length === 0;

  const renderSelectionRow = () => {
    const selectionsWithBlankRow =
      addRow || !contentTypePreviewPathSelections?.length
        ? contentTypePreviewPathSelections.concat({ contentType: '', previewPath: '' })
        : contentTypePreviewPathSelections;

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

      <Tooltip
        content={
          contentTypePreviewPathSelections.length === contentTypes.length ? button.tooltip : ''
        }>
        <Button isDisabled={isAddButtonDisabled} onClick={handleAddRow} startIcon={<PlusIcon />}>
          {button.copy}
        </Button>
      </Tooltip>
    </>
  );
};
