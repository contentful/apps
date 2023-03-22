import { useEffect, useState } from 'react';
import { Box, Select, Stack, TextInput, TextLink } from '@contentful/f36-components';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
import { AllContentTypes, AllContentTypeEntries, ContentTypes, ContentTypeValue } from 'types';
import ContentTypeWarning from 'components/config-screen/assign-content-type/ContentTypeWarning';

interface Props {
  contentTypeEntry: [string, ContentTypeValue];
  index: number;
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypes: ContentTypes;
  onContentTypeChange: (prevKey: string, newKey: string) => void;
  onContentTypeFieldChange: (key: string, field: string, value: string) => void;
  onRemoveContentType: (key: string) => void;
  currentEditorInterface: Partial<EditorInterface>;
  originalContentTypes: ContentTypes;
}

const AssignContentTypeRow = (props: Props) => {
  const {
    contentTypeEntry,
    index,
    allContentTypes,
    allContentTypeEntries,
    contentTypes,
    onContentTypeChange,
    onContentTypeFieldChange,
    onRemoveContentType,
    currentEditorInterface,
    originalContentTypes,
  } = props;

  const [contentTypeId, { slugField, urlPrefix }] = contentTypeEntry;

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [contentTypeOptions, setContentTypeOptions] = useState<AllContentTypeEntries>([]);
  const [isContentTypeInOptions, setIsContentTypeInOptions] = useState<boolean>(true);
  const [isSlugFieldInOptions, setIsSlugFieldInOptions] = useState<boolean>(true);
  const [isInSidebar, setIsInSidebar] = useState<boolean>(false);

  useEffect(() => {
    const originalContentTypeIds = Object.keys(originalContentTypes);
    if (originalContentTypeIds.includes(contentTypeId)) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [contentTypeId, originalContentTypes]);

  useEffect(() => {
    const savedSidebarLocations = Object.keys(currentEditorInterface);
    if (savedSidebarLocations.includes(contentTypeId)) {
      setIsInSidebar(true);
    } else {
      setIsInSidebar(false);
    }
  }, [contentTypeId, currentEditorInterface]);

  useEffect(() => {
    const contentTypeOptions = allContentTypeEntries.filter(
      ([type]) => type === contentTypeId || !contentTypes[type]
    );
    setContentTypeOptions(contentTypeOptions);
    if (isSaved) {
      setIsContentTypeInOptions(contentTypeOptions.some((option) => option[0] === contentTypeId));
      if (slugField !== undefined) {
        setIsSlugFieldInOptions(
          allContentTypes[contentTypeId]?.fields.some((field) => field.id === slugField)
        );
      }
    }
  }, [allContentTypeEntries, contentTypeId, contentTypes, allContentTypes, isSaved, slugField]);

  const validateSelectedOption = (contentTypeId: string, slugField?: string) => {
    let value = '';

    if (
      slugField === undefined &&
      contentTypeOptions.some((option) => option[0] === contentTypeId)
    ) {
      value = contentTypeId;
    }

    if (
      slugField !== undefined &&
      allContentTypes[contentTypeId]?.fields.some((field) => field.id === slugField)
    ) {
      value = slugField;
    }

    return value;
  };

  const ContentTypeOptions = () => {
    return (
      <>
        <Select.Option value="" isDisabled>
          Select content type
        </Select.Option>
        {contentTypeOptions.map(([type, { name: typeName }]) => {
          return (
            <Select.Option value={type} key={`type-${type}`}>
              {typeName}
            </Select.Option>
          );
        })}
      </>
    );
  };

  const SlugFieldOptions = () => {
    return (
      <>
        <Select.Option value="" isDisabled>
          Select slug field
        </Select.Option>
        {contentTypeId &&
          allContentTypes[contentTypeId]?.fields?.map((field) => (
            <Select.Option key={`${contentTypeId}.${field.id}`} value={field.id}>
              {field.name}
            </Select.Option>
          ))}
      </>
    );
  };

  return (
    <Stack spacing="spacingXs" paddingBottom="spacingS" key={contentTypeId} testId="contentTypeRow">
      <ContentTypeWarning
        contentTypeId={contentTypeId}
        slugField={slugField}
        isSaved={isSaved}
        isInSidebar={isInSidebar}
        isContentTypeInOptions={isContentTypeInOptions}
        isSlugFieldInOptions={isSlugFieldInOptions}
      />
      <Box className={styles.contentTypeItem}>
        <Select
          id={`contentType-${index}`}
          name={`contentType-${index}`}
          testId="contentTypeSelect"
          isInvalid={!contentTypeId || !isContentTypeInOptions}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onContentTypeChange(contentTypeId, event.target.value)
          }
          value={validateSelectedOption(contentTypeId)}>
          <ContentTypeOptions />
        </Select>
      </Box>
      <Box className={styles.contentTypeItem}>
        <Select
          id={`slugField-${index}`}
          name={`slugField-${index}`}
          testId="slugFieldSelect"
          isDisabled={!contentTypeId || !isContentTypeInOptions}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onContentTypeFieldChange(contentTypeId, 'slugField', event.target.value)
          }
          value={validateSelectedOption(contentTypeId, slugField)}>
          <SlugFieldOptions />
        </Select>
      </Box>
      <Box className={styles.contentTypeItem}>
        <TextInput
          id={`urlPrefix-${index}`}
          name={`urlPrefix-${index}`}
          testId="urlPrefixInput"
          isDisabled={!contentTypeId || !isContentTypeInOptions}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onContentTypeFieldChange(contentTypeId, 'urlPrefix', event.target.value)
          }
          value={urlPrefix}
        />
      </Box>
      <Box className={styles.removeItem}>
        <TextLink onClick={() => onRemoveContentType(contentTypeId)}>Remove</TextLink>
      </Box>
    </Stack>
  );
};

export default AssignContentTypeRow;
