import { Box, Card, Flex, FormControl, Tooltip } from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
import { AllContentTypes, AllContentTypeEntries, ContentTypeRule, ContentTypeRules } from 'types';
import AssignContentTypeRow from 'components/config-screen/assign-content-type/AssignContentTypeRow';

interface AssignContentTypeCardProps {
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypeRules: ContentTypeRules;
  onContentTypeChange: (ruleId: string, newContentTypeId: string) => void;
  onContentTypeFieldChange: (
    ruleId: string,
    field: string,
    value: string | boolean | string[]
  ) => void;
  onContentTypeRuleChange: (ruleId: string, updates: Partial<ContentTypeRule>) => void;
  onRemoveContentType: (ruleId: string) => void;
  currentEditorInterface: Partial<EditorInterface>;
  originalContentTypeRules: ContentTypeRules;
  rulesMissingPattern: Set<string>;
  rulesWithUnknownPatternTokens: Map<string, string[]>;
  rulesWithMissingSelectedPatternTokens: Map<string, string[]>;
  duplicateRuleIds: Set<string>;
  showPatternValidation: boolean;
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
    onContentTypeRuleChange,
    onRemoveContentType,
    currentEditorInterface,
    originalContentTypeRules,
    rulesMissingPattern,
    rulesWithUnknownPatternTokens,
    rulesWithMissingSelectedPatternTokens,
    duplicateRuleIds,
    showPatternValidation,
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
          helpText="For standard paths, choose the short text field where the entry stores its page path. Use advanced matching to build a custom page path."
        />
        <HeaderLabel
          label="URL prefix"
          helpText='An optional prefix that appears before the slug in the page URL. Example: "/blog/"'
        />
        <HeaderLabel
          label="Advanced"
          className={styles.toggleItem}
          helpText="Enable advanced matching to build a custom path pattern from entry fields, locale, and/or wildcards."
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
            onContentTypeRuleChange={onContentTypeRuleChange}
            onRemoveContentType={onRemoveContentType}
            currentEditorInterface={currentEditorInterface}
            originalContentTypeRules={originalContentTypeRules}
            isMissingPattern={showPatternValidation && rulesMissingPattern.has(contentTypeRule.id)}
            unknownPatternTokens={
              showPatternValidation
                ? rulesWithUnknownPatternTokens.get(contentTypeRule.id) ?? []
                : []
            }
            missingSelectedPatternTokens={
              showPatternValidation
                ? rulesWithMissingSelectedPatternTokens.get(contentTypeRule.id) ?? []
                : []
            }
            isDuplicateConfiguration={
              showPatternValidation && duplicateRuleIds.has(contentTypeRule.id)
            }
            focus={index + 1 === contentTypeRules.length}
          />
        );
      })}
    </Card>
  );
};

export default AssignContentTypeCard;
