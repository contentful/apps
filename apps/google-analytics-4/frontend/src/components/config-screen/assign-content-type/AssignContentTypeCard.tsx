import { Box, Card, FormControl, Stack } from '@contentful/f36-components';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { AllContentTypes, AllContentTypeEntries, ContentTypes, ContentTypeEntries } from 'types';
import AssignContentTypeRow from 'components/config-screen/assign-content-type/AssignContentTypeRow';

interface AssignContentTypeCardProps {
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypes: ContentTypes;
  contentTypeEntries: ContentTypeEntries;
  onContentTypeChange: (prevKey: string, newKey: string) => void;
  onContentTypeFieldChange: (key: string, field: string, value: string) => void;
  onRemoveContentType: (key: string) => void;
  currentEditorInterface: Partial<EditorInterface>;
  originalParameters: KeyValueMap;
}

interface HeaderLabelProps {
  label: string;
}

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

const AssignContentTypeCard = (props: AssignContentTypeCardProps) => {
  const {
    allContentTypes,
    allContentTypeEntries,
    contentTypes,
    contentTypeEntries,
    onContentTypeChange,
    onContentTypeFieldChange,
    onRemoveContentType,
    currentEditorInterface,
    originalParameters,
  } = props;

  return (
    <Card>
      <Stack marginBottom="none" spacing="spacingXs">
        <Box className={styles.statusItem}></Box>
        <HeaderLabel label="Content type" />
        <HeaderLabel label="Slug field" />
        <HeaderLabel label="URL prefix" />
        <Box className={styles.removeItem}></Box>
      </Stack>
      {contentTypeEntries.map((contentTypeEntry, index) => {
        return (
          <AssignContentTypeRow
            key={contentTypeEntry[0]}
            contentTypeEntry={contentTypeEntry}
            index={index}
            allContentTypes={allContentTypes}
            allContentTypeEntries={allContentTypeEntries}
            contentTypes={contentTypes}
            onContentTypeChange={onContentTypeChange}
            onContentTypeFieldChange={onContentTypeFieldChange}
            onRemoveContentType={onRemoveContentType}
            currentEditorInterface={currentEditorInterface}
            originalParameters={originalParameters}
          />
        );
      })}
    </Card>
  );
};

export default AssignContentTypeCard;
