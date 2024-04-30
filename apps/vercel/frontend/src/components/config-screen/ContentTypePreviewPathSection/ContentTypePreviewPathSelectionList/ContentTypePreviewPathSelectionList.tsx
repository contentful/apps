import { PlusIcon } from '@contentful/f36-icons';
import { Button, Tooltip } from '@contentful/f36-components';
import { useState, useContext, useEffect } from 'react';

import {
  ApplyContentTypePreviewPathSelectionPayload,
  ContentTypePreviewPathSelection,
  PreviewPathError,
} from '@customTypes/configPage';
import { ContentTypePreviewPathSelectionRow } from '../ContentTypePreviewPathSelectionRow/ContentTypePreviewPathSelectionRow';
import { getAvailableContentTypes } from '@utils/getAvailableContentTypes';
import { errorsActions, parametersActions } from '@constants/enums';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { copies } from '@constants/copies';

export const ContentTypePreviewPathSelectionList = () => {
  const [addRow, setAddRow] = useState<boolean>(false);
  const [previewPathErrors, setPreviewPathErrors] = useState<PreviewPathError[]>([]);

  const { dispatchParameters, parameters, contentTypes, dispatchErrors, errors } =
    useContext(ConfigPageContext);
  const { contentTypePreviewPathSelections } = parameters;

  const { button } = copies.configPage.contentTypePreviewPathSection;

  const filterContentTypes = getAvailableContentTypes(
    contentTypes,
    contentTypePreviewPathSelections
  );

  const handleUpdateParameters = (parameters: ApplyContentTypePreviewPathSelectionPayload) => {
    if (addRow) setAddRow(false);
    dispatchParameters({
      type: parametersActions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  const handleRemoveRow = (parameters: ContentTypePreviewPathSelection) => {
    if (addRow) setAddRow(false);

    dispatchParameters({
      type: parametersActions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
      payload: parameters,
    });
  };

  const handleAddRow = () => {
    setAddRow(true);
  };

  const handleErrors = (pathError: PreviewPathError) => {
    setPreviewPathErrors((prev) => {
      const isDuplicateRowError = prev.some(
        (prevPathError) => prevPathError.contentType === pathError.contentType
      );
      const newErrors = prev.map((existingError) => {
        if (existingError.contentType === pathError.contentType) {
          existingError.contentType = pathError.contentType;
          existingError.emptyPreviewPathInput = pathError.emptyPreviewPathInput;
          existingError.invalidPreviewPathFormat = pathError.invalidPreviewPathFormat;
        }
        return existingError;
      });
      const previewPathErrors = isDuplicateRowError ? newErrors : [...newErrors, pathError];
      return previewPathErrors;
    });
  };

  useEffect(() => {
    if (previewPathErrors.length) {
      dispatchErrors({
        type: errorsActions.UPDATE_PREVIEW_PATH_ERRORS,
        payload: previewPathErrors,
      });
    }
  }, [previewPathErrors]);

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
        onError={handleErrors}
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
