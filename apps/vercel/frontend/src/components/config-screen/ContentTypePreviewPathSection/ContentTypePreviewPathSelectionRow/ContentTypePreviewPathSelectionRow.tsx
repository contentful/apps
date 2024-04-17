import { ChangeEvent, useContext, useMemo } from 'react';
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

interface Props {
  contentTypes: ContentType[];
  configuredContentTypePreviewPathSelection?: ContentTypePreviewPathSelection;
  onParameterUpdate: (parameters: ApplyContentTypePreviewPathSelectionPayload) => void;
  onRemoveRow: (parameters: ContentTypePreviewPathSelection) => void;
  renderLabel?: boolean;
}

export const ContentTypePreviewPathSelectionRow = ({
  contentTypes,
  configuredContentTypePreviewPathSelection = { contentType: '', previewPath: '' },
  onParameterUpdate,
  onRemoveRow,
  renderLabel,
}: Props) => {
  const { contentType: configuredContentType, previewPath: configuredPreviewPath } =
    configuredContentTypePreviewPathSelection;

  const { inputs } = copies.configPage.contentTypePreviewPathSection;

  const { isAppConfigurationSaved } = useContext(ConfigPageContext);

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

  const isPreviewPathInvalid = useMemo(() => {
    return isAppConfigurationSaved && !configuredPreviewPath && !!configuredContentType;
  }, [isAppConfigurationSaved, configuredPreviewPath, configuredContentType]);

  return (
    <Box className={styles.wrapper}>
      <FormControl marginBottom="spacingM" id="contentTypePreviewPathSelection">
        <Flex
          flexDirection="row"
          justifyContent="space-evenly"
          alignItems={isPreviewPathInvalid ? 'normal' : 'flex-end'}
          gap={tokens.spacingXs}>
          <Box className={styles.inputWrapper}>
            <Select
              placeholder={inputs.contentType.placeholder}
              label={renderLabel ? inputs.contentType.label : undefined}
              value={configuredContentType}
              emptyMessage={inputs.contentType.emptyMessage}
              options={contentTypeOptions}
              isRequired={true}
              onChange={handleContentTypeChange}></Select>
          </Box>
          <Box className={styles.inputWrapper}>
            {renderLabel && (
              <FormControl.Label isRequired>{inputs.previewPath.label}</FormControl.Label>
            )}
            <TextInput
              defaultValue={configuredPreviewPath}
              isDisabled={!configuredContentType || !contentTypes.length}
              onChange={debouncedHandlePreviewPathInputChange}
              placeholder={inputs.previewPath.placeholder}
              isInvalid={isPreviewPathInvalid}
            />
            {isPreviewPathInvalid && (
              <ValidationMessage>{inputs.previewPath.errorMessage}</ValidationMessage>
            )}
          </Box>
          <IconButton onClick={handleRemoveRow} icon={<CloseIcon />} aria-label={'Delete row'} />
        </Flex>
      </FormControl>
    </Box>
  );
};
