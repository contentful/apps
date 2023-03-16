import { Box, Select, Stack, TextInput, TextLink, Tooltip } from '@contentful/f36-components';
import { WarningIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { AllContentTypes, AllContentTypeEntries, ContentTypes, ContentTypeValue } from 'types';

interface Props {
  contentTypeEntry: [string, ContentTypeValue];
  index: number;
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypes: ContentTypes;
  onContentTypeChange: (prevKey: string, newKey: string) => void;
  onContentTypeFieldChange: (key: string, field: string, value: string) => void;
  onRemoveContentType: (key: string) => void;
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
  } = props;

  const [contentTypeId, { slugField, urlPrefix }] = contentTypeEntry;

  const renderStatusItem = (key: string, slugField: string) => {
    if (key && !slugField) {
      return (
        <Box className={styles.statusItem} testId="warningIcon">
          <Tooltip content="This content type must have a slug field selected in order for the app to render correctly in the sidebar">
            <WarningIcon variant="warning" />
          </Tooltip>
        </Box>
      );
    } else {
      return <Box className={styles.statusItem} testId="noStatus" />;
    }
  };

  const getContentTypeOptions = () => {
    return (
      <>
        <Select.Option value="" isDisabled>
          Select content type
        </Select.Option>
        {allContentTypeEntries
          .filter(([type]) => type === contentTypeId || !contentTypes[type])
          .map(([type, { name: typeName }]) => {
            return (
              <Select.Option value={type} key={`type-${type}`}>
                {typeName}
              </Select.Option>
            );
          })}
      </>
    );
  };

  const getSlugFieldOptions = () => {
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
      {renderStatusItem(contentTypeId, slugField)}
      <Box className={styles.contentTypeItem}>
        <Select
          id={`contentType-${index}`}
          name={`contentType-${index}`}
          testId="contentTypeSelect"
          isInvalid={!contentTypeId}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onContentTypeChange(contentTypeId, event.target.value)
          }
          value={contentTypeId}>
          {getContentTypeOptions()}
        </Select>
      </Box>
      <Box className={styles.contentTypeItem}>
        <Select
          id={`slugField-${index}`}
          name={`slugField-${index}`}
          testId="slugFieldSelect"
          isDisabled={!contentTypeId}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
            onContentTypeFieldChange(contentTypeId, 'slugField', event.target.value)
          }
          value={slugField}>
          {getSlugFieldOptions()}
        </Select>
      </Box>
      <Box className={styles.contentTypeItem}>
        <TextInput
          id={`urlPrefix-${index}`}
          name={`urlPrefix-${index}`}
          testId="urlPrefixInput"
          isDisabled={!contentTypeId}
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
