import {
  Box,
  Button,
  Card,
  FormControl,
  Select,
  Stack,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { AllContentTypes, ContentTypeEntries } from 'types';

interface Props {
  allContentTypes: AllContentTypes;
  contentTypeEntries: ContentTypeEntries;
  onContentTypeChange: (prevKey: string, newKey: string) => void;
  onContentTypeFieldChange: (key: string, field: string, value: string) => void;
  onAddContentType: () => void;
  onRemoveContentType: (key: string) => void;
}

const styles = {
  contentTypeItem: css({
    flex: 4,
  }),
  removeItem: css({
    flex: 1,
  }),
};

const AssignContentTypeCard = (props: Props) => {
  const {
    allContentTypes,
    contentTypeEntries,
    onContentTypeChange,
    onContentTypeFieldChange,
    onAddContentType,
    onRemoveContentType,
  } = props;

  return (
    <Card>
      {Object.keys(contentTypeEntries).length ? (
        <Stack marginBottom="none" spacing="spacingXs">
          <Box className={styles.contentTypeItem}>
            <FormControl marginBottom="none">
              <FormControl.Label>Content type</FormControl.Label>
            </FormControl>
          </Box>
          <Box className={styles.contentTypeItem}>
            <FormControl marginBottom="none">
              <FormControl.Label>Slug field</FormControl.Label>
            </FormControl>
          </Box>
          <Box className={styles.contentTypeItem}>
            <FormControl marginBottom="none">
              <FormControl.Label>URL prefix</FormControl.Label>
            </FormControl>
          </Box>
          <Box className={styles.removeItem}></Box>
        </Stack>
      ) : null}
      {Object.entries(contentTypeEntries).map(([key, { slugField, urlPrefix }], index) => {
        return (
          <Stack spacing="spacingXs" paddingBottom="spacingS" key={key}>
            <Box className={styles.contentTypeItem}>
              <Select
                id={`contentType-${index}`}
                name={`contentType-${index}`}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  onContentTypeChange(key, event.target.value)
                }
                value={key}>
                <Select.Option value="" isDisabled>
                  Select content type
                </Select.Option>
                {Object.entries(allContentTypes)
                  .filter(([type]) => type === key || !contentTypeEntries[type])
                  .map(([type, { name: typeName }]) => {
                    return (
                      <Select.Option value={type} key={`type-${type}`}>
                        {typeName}
                      </Select.Option>
                    );
                  })}
              </Select>
            </Box>
            <Box className={styles.contentTypeItem}>
              <Select
                id={`slugField-${index}`}
                name={`slugField-${index}`}
                isDisabled={!key}
                isInvalid={key ? !slugField : false}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  onContentTypeFieldChange(key, 'slugField', event.target.value)
                }
                value={slugField}>
                <Select.Option value="" isDisabled>
                  Select slug field
                </Select.Option>
                {key &&
                  allContentTypes[key]?.fields?.map((field) => (
                    <Select.Option key={`${key}.${field.id}`} value={field.id}>
                      {field.name}
                    </Select.Option>
                  ))}
              </Select>
            </Box>
            <Box className={styles.contentTypeItem}>
              <TextInput
                id={`urlPrefix-${index}`}
                name={`urlPrefix-${index}`}
                isDisabled={!key}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onContentTypeFieldChange(key, 'urlPrefix', event.target.value)
                }
                value={urlPrefix}
              />
            </Box>
            <Box className={styles.removeItem}>
              <TextLink onClick={() => onRemoveContentType(key)}>Remove</TextLink>
            </Box>
          </Stack>
        );
      })}
      <Button
        onClick={onAddContentType}
        isDisabled={Object.values(contentTypeEntries).some((entries) => !entries.slugField)}>
        {Object.keys(contentTypeEntries).length ? 'Add another content type' : 'Add a content type'}
      </Button>
    </Card>
  );
};

export default AssignContentTypeCard;
