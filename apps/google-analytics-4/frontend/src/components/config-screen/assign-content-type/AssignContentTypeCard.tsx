import { Box, Card, Flex, FormControl, Tooltip } from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
import { AllContentTypes, AllContentTypeEntries, ContentTypeRules } from 'types';
import AssignContentTypeRow from 'components/config-screen/assign-content-type/AssignContentTypeRow';

interface AssignContentTypeCardProps {
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypeRules: ContentTypeRules;
  onContentTypeChange: (ruleId: string, newContentTypeId: string) => void;
  onContentTypeFieldChange: (ruleId: string, field: string, value: string | boolean | string[]) => void;
  onRemoveContentType: (ruleId: string) => void;
  currentEditorInterface: Partial<EditorInterface>;
  originalContentTypeRules: ContentTypeRules;
}

interface HeaderLabelProps {
  label: string;
  helpText?: string;
  className?: string;
}

const HeaderLabel = (props: HeaderLabelProps) => {
  const { label, helpText, className } = props;

  const defaultClassName = label === 'URL prefix' ? styles.urlPrefixItem : styles.contentTypeItem;

  return (
    <Box className={className || defaultClassName}>
      <FormControl marginBottom="none">
        <FormControl.Label>
          <Flex alignItems="center">
            {label}
            {helpText && (
              <Tooltip placement="top" content={helpText}>
                <Flex marginLeft="spacing2Xs" className={styles.tooltipIcon}>
                  <HelpCircleIcon />
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
    contentTypeRules,
    onContentTypeChange,
    onContentTypeFieldChange,
    onRemoveContentType,
    currentEditorInterface,
    originalContentTypeRules,
  } = props;

  return (
    <Card>
      <Flex marginBottom="spacingXs" className={styles.baseRow}>
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
          helpText='An optional prefix that appears before the slug in the page URL. Example: "/blog/"'
        />
        <HeaderLabel
          label="Advanced"
          className={styles.toggleItem}
          helpText="Use advanced matching for query strings or variable prefixes that do not fit the standard URL prefix plus slug setup."
        />
        <Box className={styles.removeItem}></Box>
      </Flex>
      {contentTypeRules.map((contentTypeRule, index) => {
        return (
          <AssignContentTypeRow
            key={contentTypeRule.id}
            contentTypeRule={contentTypeRule}
            index={index}
            allContentTypes={allContentTypes}
            allContentTypeEntries={allContentTypeEntries}
            contentTypeRules={contentTypeRules}
            onContentTypeChange={onContentTypeChange}
            onContentTypeFieldChange={onContentTypeFieldChange}
            onRemoveContentType={onRemoveContentType}
            currentEditorInterface={currentEditorInterface}
            originalContentTypeRules={originalContentTypeRules}
            focus={index + 1 === contentTypeRules.length}
          />
        );
      })}
    </Card>
  );
};

export default AssignContentTypeCard;
