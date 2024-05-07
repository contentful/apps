import { ChangeEvent, useContext, useEffect, useMemo } from 'react';
import {
  Box,
  FormControl,
  TextInput,
  Flex,
  IconButton,
  ValidationMessage,
} from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { debounce } from 'lodash';
import tokens from '@contentful/f36-tokens';
import { ContentType } from '@contentful/app-sdk';
import {
  ApplyContentTypePreviewPathSelectionPayload,
  ContentTypePreviewPathSelection,
} from '@customTypes/configPage';
import { styles } from './ContentTypePreviewPathSelectionRow.styles';
import { copies } from '@constants/copies';
import { Select } from '@components/common/Select/Select';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { errorsActions } from '@constants/enums';
import { useError } from '@hooks/useError/useError';

interface Props {
  contentTypes: ContentType[];
  configuredContentTypePreviewPathSelection?: ContentTypePreviewPathSelection;
  onParameterUpdate: (parameters: ApplyContentTypePreviewPathSelectionPayload) => void;
  onRemoveRow: (parameters: ContentTypePreviewPathSelection) => void;
  renderLabel?: boolean;
  rowId: number;
}

export const ContentTypePreviewPathSelectionRow = ({
  contentTypes,
  configuredContentTypePreviewPathSelection = { contentType: '', previewPath: '' },
  onParameterUpdate,
  onRemoveRow,
  renderLabel,
  rowId,
}: Props) => {
  const { isAppConfigurationSaved, isLoading, dispatchErrors, errors } =
    useContext(ConfigPageContext);

  const currentRowError = errors.previewPathSelection.find(
    (error) => error.contentType === configuredContentTypePreviewPathSelection.contentType
  );
  const { message, isError } = useError({
    error: currentRowError,
    contentType: configuredContentTypePreviewPathSelection.contentType,
  });

  const { contentType: configuredContentType, previewPath: configuredPreviewPath } =
    configuredContentTypePreviewPathSelection;
  const { inputs } = copies.configPage.contentTypePreviewPathSection;

  const handlePreviewPathInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onParameterUpdate({
      oldContentType: configuredContentType,
      newContentType: configuredContentType,
      newPreviewPath: event.target.value,
    });
  };

  const handleContentTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onParameterUpdate({
      oldContentType: configuredContentType,
      newContentType: event.target.value,
      newPreviewPath: configuredPreviewPath,
    });
  };

  const handleRemoveRow = () => {
    onRemoveRow(configuredContentTypePreviewPathSelection);
  };

  const validatePreviewPath = (previewPath: string) =>
    [/^\/.*{([^}]+)}.*$/].some((regex) => regex.test(previewPath));

  const debouncedHandlePreviewPathInputChange = useMemo(
    () => debounce(handlePreviewPathInput, 700),
    []
  );

  const contentTypeOptions = useMemo(
    () =>
      contentTypes.map((contentType) => ({
        id: contentType.sys.id,
        name: contentType.name,
      })),
    [contentTypes]
  );

  useEffect(() => {
    const isPreviewPathEmpty =
      isAppConfigurationSaved && !configuredPreviewPath && !!configuredContentType;
    if (isPreviewPathEmpty) {
      dispatchErrors({
        type: errorsActions.UPDATE_PREVIEW_PATH_ERRORS,
        payload: {
          contentType: configuredContentType,
          invalidPreviewPathFormat: false,
          emptyPreviewPathInput: true,
        },
      });
    }
  }, [isAppConfigurationSaved, configuredPreviewPath, configuredContentType]);

  useEffect(() => {
    if (!isAppConfigurationSaved) {
      dispatchErrors({
        type: errorsActions.RESET_PREVIEW_PATH_ERRORS,
      });
    } else if (configuredPreviewPath) {
      const isPreviewPathValid = validatePreviewPath(configuredPreviewPath);
      if (!isPreviewPathValid) {
        dispatchErrors({
          type: errorsActions.UPDATE_PREVIEW_PATH_ERRORS,
          payload: {
            contentType: configuredContentType,
            invalidPreviewPathFormat: true,
            emptyPreviewPathInput: false,
          },
        });
      }
    }
  }, [isAppConfigurationSaved, configuredPreviewPath]);

  const itemAlignment = useMemo(() => {
    if (isError) {
      return renderLabel ? 'normal' : 'baseline';
    }
    return 'flex-end';
  }, [isError, renderLabel]);

  return (
    <Box className={styles.wrapper}>
      <FormControl marginBottom="spacingM" id={'contentTypePreviewPathSelection-' + rowId}>
        <Flex
          flexDirection="row"
          justifyContent="space-evenly"
          alignItems={itemAlignment}
          gap={tokens.spacingXs}>
          <Box className={styles.inputWrapper}>
            <Select
              placeholder={inputs.contentType.placeholder}
              label={renderLabel ? inputs.contentType.label : undefined}
              value={configuredContentType}
              emptyMessage={inputs.contentType.emptyMessage}
              options={contentTypeOptions}
              isRequired={true}
              isLoading={isLoading}
              onChange={handleContentTypeChange}></Select>
          </Box>
          <Box className={styles.inputWrapper}>
            {renderLabel && (
              <FormControl.Label isRequired>{inputs.previewPath.label}</FormControl.Label>
            )}
            <Flex gap={tokens.spacing2Xs}>
              <TextInput
                defaultValue={configuredPreviewPath}
                isDisabled={!configuredContentType || !contentTypes.length}
                onChange={debouncedHandlePreviewPathInputChange}
                placeholder={inputs.previewPath.placeholder}
                isInvalid={isError}
              />
              <IconButton
                onClick={handleRemoveRow}
                icon={<CloseIcon />}
                aria-label={'Delete row'}
              />
            </Flex>

            {isError && <ValidationMessage>{message}</ValidationMessage>}
          </Box>
        </Flex>
      </FormControl>
    </Box>
  );
};
