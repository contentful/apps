import { Box, Card, Flex, FormControl, Stack, Tooltip } from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
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
  originalContentTypes: ContentTypes;
}

interface HeaderLabelProps {
  label: string;
  helpText?: string;
}

const HeaderLabel = (props: HeaderLabelProps) => {
  const { label, helpText } = props;

  return (
    <Box className={styles.contentTypeItem}>
      <FormControl marginBottom="none">
        <FormControl.Label>
          <Flex alignItems="center">
            {label}
            {helpText && (
              <Tooltip placement="top" content={helpText}>
                <Flex marginLeft="spacing2Xs">
                  <HelpCircleIcon variant="primary" />
                </Flex>
              </Tooltip>
            )}
          </Flex>
        </FormControl.Label>
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
    originalContentTypes,
  } = props;

  return (
    <Card>
      <Stack marginBottom="none" spacing="spacingXs">
        <Box className={styles.statusItem}></Box>
        <HeaderLabel
          label="Content type"
          helpText='A content type connected to a page on your website. Example: "Blog Post"'
        />
        <HeaderLabel
          label="Slug field"
          helpText='The field on your content type where the page path is stored. If you select a short text list field, the elements in the array will be joined by a forward slash. Example: This field would typically have short slug text like "a-blog-post-i-wrote" that appears in the URL for the page.'
        />
        <HeaderLabel
          label="URL prefix"
          helpText='The URL prefix (if any) where pages of this content type appear. Example: If you were hosting a blog, a typical URL might be "www.myblog.com/blogs/a-blog-post-i-wrote". In this case, "blogs" would be the prefix that combines correctly with the selected slug field.'
        />
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
            originalContentTypes={originalContentTypes}
            focus={index + 1 === contentTypeEntries.length}
          />
        );
      })}
    </Card>
  );
};

export default AssignContentTypeCard;
