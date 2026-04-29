import { useEffect, useState } from 'react';
import {
  Box,
  Checkbox,
  Flex,
  FormControl,
  Select,
  Stack,
  Text,
  TextInput,
  TextLink,
  Tooltip,
} from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { styles } from 'components/config-screen/assign-content-type/AssignContentType.styles';
import { EditorInterface } from '@contentful/app-sdk';
import {
  AllContentTypes,
  AllContentTypeEntries,
  ContentTypeRule,
  ContentTypeRules,
  ContentTypeValue,
} from 'types';
import ContentTypeWarning from 'components/config-screen/assign-content-type/ContentTypeWarning';
import { buildDefaultPathPattern } from 'utils/getReportSlug';

interface Props {
  contentTypeRule: ContentTypeRule;
  index: number;
  allContentTypes: AllContentTypes;
  allContentTypeEntries: AllContentTypeEntries;
  contentTypeRules: ContentTypeRules;
  isMissingPattern: boolean;
  unknownPatternTokens: string[];
  isDuplicateConfiguration: boolean;
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
  focus: boolean;
}

const AssignContentTypeRow = (props: Props) => {
  const {
    contentTypeRule,
    index,
    allContentTypes,
    allContentTypeEntries,
    contentTypeRules,
    isMissingPattern,
    unknownPatternTokens,
    isDuplicateConfiguration,
    onContentTypeChange,
    onContentTypeFieldChange,
    onContentTypeRuleChange,
    onRemoveContentType,
    currentEditorInterface,
    originalContentTypeRules,
    focus,
  } = props;

  const [
    ruleId,
    {
      contentTypeId,
      slugField,
      urlPrefix,
      enableAdvancedMatching,
      pathPattern = '',
      additionalFieldIds = [],
      matchDimension = 'unifiedPagePathScreen',
      matchType = 'EXACT',
    },
  ] = [contentTypeRule.id, contentTypeRule];

  const [isSaved, setIsSaved] = useState(false);
  const [contentTypeOptions, setContentTypeOptions] = useState<AllContentTypeEntries>([]);
  const [isContentTypeInOptions, setIsContentTypeInOptions] = useState(true);
  const [isSlugFieldInOptions, setIsSlugFieldInOptions] = useState(true);
  const [isInSidebar, setIsInSidebar] = useState(false);
  const [showAdvancedMatching, setShowAdvancedMatching] = useState(Boolean(enableAdvancedMatching));

  useEffect(() => {
    setIsSaved(originalContentTypeRules.some((rule) => rule.id === ruleId));
  }, [originalContentTypeRules, ruleId]);

  useEffect(() => {
    setIsInSidebar(Object.keys(currentEditorInterface).includes(contentTypeId));
  }, [contentTypeId, currentEditorInterface]);

  useEffect(() => {
    const nextContentTypeOptions = allContentTypeEntries;
    setContentTypeOptions(nextContentTypeOptions);

    if (isSaved) {
      setIsContentTypeInOptions(
        nextContentTypeOptions.some((option) => option[0] === contentTypeId)
      );
      if (slugField !== undefined) {
        setIsSlugFieldInOptions(
          allContentTypes[contentTypeId]?.fields.some((field) => field.id === slugField)
        );
      }
    }
  }, [allContentTypeEntries, allContentTypes, contentTypeId, contentTypeRules, isSaved, slugField]);

  useEffect(() => {
    setShowAdvancedMatching(Boolean(enableAdvancedMatching));
  }, [enableAdvancedMatching]);

  useEffect(() => {
    if (focus) {
      const contentTypeSelect = document.getElementById(`contentType-${index}`);
      if (contentTypeSelect) contentTypeSelect.focus();
    }
  }, [focus, index]);

  const validateSelectedOption = (entryContentTypeId: string, fieldId?: string) => {
    let value = '';

    if (
      fieldId === undefined &&
      contentTypeOptions.some((option) => option[0] === entryContentTypeId)
    ) {
      value = entryContentTypeId;
    }

    if (
      fieldId !== undefined &&
      allContentTypes[entryContentTypeId]?.fields.some((field) => field.id === fieldId)
    ) {
      value = fieldId;
    }

    return value;
  };

  const selectableAdditionalFields =
    contentTypeId && allContentTypes[contentTypeId]?.fields
      ? allContentTypes[contentTypeId].fields.filter((field) => field.id !== slugField)
      : [];

  const getGeneratedPattern = (
    selectedFieldIds = additionalFieldIds,
    selectedMatchDimension = matchDimension
  ) => buildDefaultPathPattern(urlPrefix, selectedFieldIds, selectedMatchDimension);

  const suggestedPattern = getGeneratedPattern();
  const hasInvalidPattern = isMissingPattern || unknownPatternTokens.length > 0;
  const unknownPatternMessage =
    unknownPatternTokens.length === 1
      ? `Pattern contains an unknown variable: {${unknownPatternTokens[0]}}. Use {slug} and the variables shown in Additional page properties.`
      : `Pattern contains unknown variables: ${unknownPatternTokens
          .map((token) => `{${token}}`)
          .join(', ')}. Use {slug} and the variables shown in Additional page properties.`;

  return (
    <Stack
      spacing="spacingS"
      flexDirection="column"
      className={
        showAdvancedMatching
          ? `${styles.advancedMatchingGroup} ${styles.rowSpacing}`
          : styles.rowSpacing
      }
      key={contentTypeId}
      testId="contentTypeRow">
      <ContentTypeWarning
        contentTypeId={contentTypeId}
        slugField={slugField}
        isSaved={isSaved}
        isInSidebar={isInSidebar}
        isContentTypeInOptions={isContentTypeInOptions}
        isSlugFieldInOptions={isSlugFieldInOptions}
      />
      <Box className={styles.baseRowPanel}>
        <Flex className={styles.baseRow}>
          <Box className={styles.contentTypeItem}>
            <Select
              id={`contentType-${index}`}
              name={`contentType-${index}`}
              testId="contentTypeSelect"
              isInvalid={!isContentTypeInOptions && contentTypeId !== ''}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                onContentTypeChange(ruleId, event.target.value)
              }
              value={validateSelectedOption(contentTypeId)}>
              <Select.Option value="" isDisabled>
                Select content type
              </Select.Option>
              {contentTypeOptions.map(([type, { name: typeName }]) => (
                <Select.Option value={type} key={`type-${type}`}>
                  {typeName}
                </Select.Option>
              ))}
            </Select>
          </Box>
          <Box className={styles.contentTypeItem}>
            <Select
              id={`slugField-${index}`}
              name={`slugField-${index}`}
              testId="slugFieldSelect"
              isDisabled={!contentTypeId || !isContentTypeInOptions}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                onContentTypeFieldChange(ruleId, 'slugField', event.target.value)
              }
              value={validateSelectedOption(contentTypeId, slugField)}>
              <Select.Option value="" isDisabled>
                Select slug field
              </Select.Option>
              {contentTypeId &&
                allContentTypes[contentTypeId]?.fields?.map((field) => (
                  <Select.Option key={`${contentTypeId}.${field.id}`} value={field.id}>
                    {field.name}
                  </Select.Option>
                ))}
            </Select>
          </Box>
          <Box className={styles.urlPrefixItem}>
            {!showAdvancedMatching ? (
              <TextInput
                id={`urlPrefix-${index}`}
                name={`urlPrefix-${index}`}
                testId="urlPrefixInput"
                isDisabled={!contentTypeId || !isContentTypeInOptions}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onContentTypeFieldChange(ruleId, 'urlPrefix', event.target.value)
                }
                value={urlPrefix}
              />
            ) : (
              <Text fontColor="gray500">Configured below</Text>
            )}
          </Box>
          <Box className={styles.toggleItem}>
            <Checkbox
              id={`advancedMatching-${index}`}
              name={`advancedMatching-${index}`}
              testId="advancedMatchingToggle"
              isChecked={showAdvancedMatching}
              isDisabled={!contentTypeId || !isContentTypeInOptions}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const nextIsAdvanced = event.target.checked;
                setShowAdvancedMatching(nextIsAdvanced);
                if (nextIsAdvanced) {
                  onContentTypeRuleChange(ruleId, {
                    enableAdvancedMatching: true,
                  });
                  return;
                }

                onContentTypeRuleChange(ruleId, {
                  enableAdvancedMatching: false,
                });
              }}>
              Advanced
            </Checkbox>
          </Box>
          <Box className={styles.removeItem}>
            <TextLink as="button" onClick={() => onRemoveContentType(ruleId)}>
              Remove
            </TextLink>
          </Box>
        </Flex>
        {isDuplicateConfiguration && (
          <FormControl isInvalid marginBottom="none">
            <FormControl.ValidationMessage>
              This rule duplicates another configuration. Remove one of them or change one of the
              values before saving.
            </FormControl.ValidationMessage>
          </FormControl>
        )}
      </Box>
      {showAdvancedMatching && (
        <Box className={styles.advancedMatchingPanel} testId="advancedMatchingPanel">
          <Text fontColor="gray600" className={styles.advancedMatchingIntro}>
            Build a custom URL pattern for query strings, extra path segments, or variable prefixes.
          </Text>
          <Box className={styles.advancedMatchingFields}>
            <Flex className={styles.advancedMatchingTopRow}>
              <Box className={styles.stackedField}>
                <FormControl marginBottom="none">
                  <FormControl.Label>Additional page properties</FormControl.Label>
                  <Stack spacing="spacing2Xs" flexDirection="column" alignItems="flex-start">
                    {selectableAdditionalFields.length ? (
                      selectableAdditionalFields.map((field) => (
                        <Checkbox
                          key={`${contentTypeId}.${field.id}`}
                          testId={`additionalFieldOption-${field.id}`}
                          isChecked={additionalFieldIds.includes(field.id)}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const checked = event.target.checked;
                            const nextSelectedFields = checked
                              ? [...additionalFieldIds, field.id]
                              : additionalFieldIds.filter(
                                  (selectedFieldId) => selectedFieldId !== field.id
                                );
                            onContentTypeFieldChange(
                              ruleId,
                              'additionalFieldIds',
                              nextSelectedFields
                            );
                          }}>
                          <Flex alignItems="center" gap="spacing2Xs">
                            <Text as="span">{field.name}</Text>
                            <Text as="span" fontColor="gray600">
                              {`{${field.id}}`}
                            </Text>
                          </Flex>
                        </Checkbox>
                      ))
                    ) : (
                      <Text fontColor="gray500">
                        No extra fields available for this content type.
                      </Text>
                    )}
                  </Stack>
                  <FormControl.HelpText>
                    Select extra fields to include in the URL. Use the variable shown next to each
                    field in the pattern.
                  </FormControl.HelpText>
                </FormControl>
              </Box>
              <Box className={styles.stackedField}>
                <FormControl marginBottom="none" isInvalid={hasInvalidPattern}>
                  <FormControl.Label>
                    <Flex alignItems="center">
                      Pattern
                      <Tooltip
                        placement="top"
                        content="Start with the suggested pattern shown in the field. Use {slug} for the value from the selected slug field. Enter your own pattern if you need a different URL structure or want to use variables from the left.">
                        <Flex marginLeft="spacing2Xs" className={styles.tooltipIcon}>
                          <HelpCircleIcon />
                        </Flex>
                      </Tooltip>
                    </Flex>
                  </FormControl.Label>
                  <TextInput
                    id={`pathPattern-${index}`}
                    name={`pathPattern-${index}`}
                    testId="pathPatternInput"
                    isDisabled={!contentTypeId || !isContentTypeInOptions}
                    isInvalid={hasInvalidPattern}
                    placeholder={suggestedPattern}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      onContentTypeFieldChange(ruleId, 'pathPattern', event.target.value)
                    }
                    value={pathPattern}
                  />
                  {isMissingPattern && (
                    <FormControl.ValidationMessage>
                      Pattern is required. Enter a value for the Pattern field before saving.
                    </FormControl.ValidationMessage>
                  )}
                  {!isMissingPattern && unknownPatternTokens.length > 0 && (
                    <FormControl.ValidationMessage>{unknownPatternMessage}</FormControl.ValidationMessage>
                  )}
                </FormControl>
              </Box>
            </Flex>
            <Flex className={styles.advancedMatchingBottomRow}>
              <Box className={styles.compactField}>
                <FormControl>
                  <FormControl.Label>
                    <Flex alignItems="center">
                      Match against
                      <Tooltip
                        placement="top"
                        content="Choose whether to match just the page path, or the page path plus any query parameters in the URL.">
                        <Flex marginLeft="spacing2Xs" className={styles.tooltipIcon}>
                          <HelpCircleIcon />
                        </Flex>
                      </Tooltip>
                    </Flex>
                  </FormControl.Label>
                  <Select
                    id={`matchDimension-${index}`}
                    name={`matchDimension-${index}`}
                    testId="matchDimensionSelect"
                    isDisabled={!contentTypeId || !isContentTypeInOptions}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                      onContentTypeFieldChange(ruleId, 'matchDimension', event.target.value)
                    }
                    value={matchDimension}>
                    <Select.Option value="unifiedPagePathScreen">Page path</Select.Option>
                    <Select.Option value="pagePathPlusQueryString">
                      Page path + query string
                    </Select.Option>
                  </Select>
                </FormControl>
              </Box>
              <Box className={styles.compactField}>
                <FormControl>
                  <FormControl.Label>
                    <Flex alignItems="center">
                      Matching mode
                      <Tooltip
                        placement="top"
                        content="Use Literal for one exact URL pattern. Use Regex match when part of the URL can vary. Regex match uses regular expression syntax, so use .* when you want wildcard-style matching.">
                        <Flex marginLeft="spacing2Xs" className={styles.tooltipIcon}>
                          <HelpCircleIcon />
                        </Flex>
                      </Tooltip>
                    </Flex>
                  </FormControl.Label>
                  <Select
                    id={`matchType-${index}`}
                    name={`matchType-${index}`}
                    testId="matchTypeSelect"
                    isDisabled={!contentTypeId || !isContentTypeInOptions}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                      onContentTypeFieldChange(ruleId, 'matchType', event.target.value)
                    }
                    value={matchType}>
                    <Select.Option value="EXACT">Literal</Select.Option>
                    <Select.Option value="PARTIAL_REGEXP">Regex match</Select.Option>
                  </Select>
                </FormControl>
              </Box>
            </Flex>
          </Box>
        </Box>
      )}
    </Stack>
  );
};

export default AssignContentTypeRow;
