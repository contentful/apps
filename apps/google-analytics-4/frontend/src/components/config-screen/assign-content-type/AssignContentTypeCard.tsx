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
import { AllContentTypes, AllContentTypeEntries, ContentTypes, ContentTypeEntries } from 'types';

interface AssignContentTypeCardProps {
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypes: ContentTypes;
  hasContentTypes: boolean;
  contentTypeEntries: ContentTypeEntries;
  onContentTypeChange: (prevKey: string, newKey: string) => void;
  onContentTypeFieldChange: (key: string, field: string, value: string) => void;
  onAddContentType: () => void;
  onRemoveContentType: (key: string) => void;
}

interface HeaderLabelProps {
  label: string;
}

const styles = {
  contentTypeItem: css({
    flex: 4,
  }),
  removeItem: css({
    flex: 1,
  }),
};

const AssignContentTypeCard = (props: AssignContentTypeCardProps) => {
  const {
    allContentTypes,
    allContentTypeEntries,
    contentTypes,
    hasContentTypes,
    contentTypeEntries,
    onContentTypeChange,
    onContentTypeFieldChange,
    onAddContentType,
    onRemoveContentType,
  } = props;

  return (
    <Card>
      {hasContentTypes ? (
        <Stack marginBottom="none" spacing="spacingXs">
          <HeaderLabel label="Content type" />
          <HeaderLabel label="Slug field" />
          <HeaderLabel label="URL prefix" />
          <Box className={styles.removeItem}></Box>
        </Stack>
      ) : null}
      {contentTypeEntries.map(([key, { slugField, urlPrefix }], index) => {
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
                {allContentTypeEntries
                  .filter(([type]) => type === key || !contentTypes[type])
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
      <Button onClick={onAddContentType}>
        {hasContentTypes ? 'Add another content type' : 'Add a content type'}
      </Button>
    </Card>
  );
};

const HeaderLabel = (props: HeaderLabelProps) => {
  const { label } = props;

  return (
    <Box className={styles.contentTypeItem}>
      <FormControl marginBottom="none">
        <FormControl.Label>{label}</FormControl.Label>
      </FormControl>
    </Box>
  );
};

export default AssignContentTypeCard;
