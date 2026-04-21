import { useEffect, useState } from 'react';
import {
  Paragraph,
  Stack,
  Subheading,
  Button,
  Skeleton,
  Box,
  TextLink,
  Flex,
  Checkbox,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ContentTypeProps, createClient } from 'contentful-management';
import { KnownAppSDK, EditorInterface } from '@contentful/app-sdk';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  AllContentTypes,
  AllContentTypeEntries,
  ContentTypeRule,
  ContentTypeRules,
  ContentTypes,
} from 'types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';
import { sortAndFormatAllContentTypes } from 'helpers/contentTypeHelpers/contentTypeHelpers';
import {
  createDefaultRule,
  getUniqueContentTypeIds,
  normalizeContentTypeRules,
} from 'helpers/contentTypeRules/contentTypeRules';
interface Props {
  mergeSdkParameters: Function;
  onIsValidContentTypeAssignment: Function;
  parameters: KeyValueMap;
  currentEditorInterface: Partial<EditorInterface>;
  originalContentTypes: ContentTypes;
  originalContentTypeRules: ContentTypeRules;
}

const AssignContentTypeSection = (props: Props) => {
  const {
    mergeSdkParameters,
    onIsValidContentTypeAssignment,
    parameters,
    currentEditorInterface,
    originalContentTypes,
    originalContentTypeRules,
  } = props;

  const [forceTrailingSlash, setForceTrailingSlash] = useState<boolean>(false);

  // Content type rules state
  const [contentTypeRules, setContentTypeRules] = useState<ContentTypeRules>(
    [] as ContentTypeRules
  );
  const [loadingContentTypes, setLoadingContentTypes] = useState<boolean>(true);
  const [hasContentTypes, setHasContentTypes] = useState<boolean>(false);
  const [hasIncompleteContentTypes, setHasIncompleteContentTypes] = useState<boolean>(false);

  // All content type state
  const [allContentTypes, setAllContentTypes] = useState<AllContentTypes>({} as AllContentTypes);
  const [allContentTypeEntries, setAllContentTypeEntries] = useState<AllContentTypeEntries>(
    [] as AllContentTypeEntries
  );
  const [loadingAllContentTypes, setLoadingAllContentTypes] = useState<boolean>(true);

  const sdk = useSDK<KnownAppSDK>();

  useEffect(() => {
    setLoadingContentTypes(true);
    if (parameters.forceTrailingSlash) setForceTrailingSlash(parameters.forceTrailingSlash);
    setContentTypeRules(
      normalizeContentTypeRules(
        parameters.contentTypeRules as ContentTypeRules | undefined,
        parameters.contentTypes as ContentTypes | undefined
      )
    );
    setLoadingContentTypes(false);
  }, [parameters.contentTypeRules, parameters.contentTypes, parameters.forceTrailingSlash]);

  useEffect(() => {
    setHasContentTypes(contentTypeRules.length > 0);
    setHasIncompleteContentTypes(contentTypeRules.some((rule) => !rule.contentTypeId));
  }, [contentTypeRules]);

  const rulesMissingPattern = new Set(
    contentTypeRules
      .filter(
        (rule) => rule.enableAdvancedMatching && rule.contentTypeId && !rule.pathPattern?.trim()
      )
      .map((rule) => rule.id)
  );

  const isContentTypeAssignmentValid = rulesMissingPattern.size === 0;

  useEffect(() => {
    onIsValidContentTypeAssignment(isContentTypeAssignmentValid);
  }, [isContentTypeAssignmentValid, onIsValidContentTypeAssignment]);

  const fetchAllContentTypes = async (sdk: KnownAppSDK): Promise<ContentTypeProps[]> => {
    const cma = createClient({ apiAdapter: sdk.cmaAdapter });
    const space = await cma.getSpace(sdk.ids.space);
    const environment = await space.getEnvironment(sdk.ids.environment);

    let allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 100;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await environment.getContentTypes({ skip, limit });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items as ContentTypeProps[]);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

  useEffect(() => {
    const getAllContentTypes = async () => {
      const allContentTypes = await fetchAllContentTypes(sdk);
      const formattedContentTypes = sortAndFormatAllContentTypes(allContentTypes);

      setAllContentTypes(formattedContentTypes);
      setAllContentTypeEntries(Object.entries(formattedContentTypes));
      setLoadingAllContentTypes(false);
    };

    getAllContentTypes();
  }, [sdk]);

  const trailingSlashHandler = () => {
    setForceTrailingSlash(!forceTrailingSlash);
    mergeSdkParameters({ forceTrailingSlash: !forceTrailingSlash });
  };

  const contentTypeRulesHandler = (newContentTypeRules: ContentTypeRules) => {
    setContentTypeRules(newContentTypeRules);
    const _parameters = { contentTypeRules: newContentTypeRules };
    mergeSdkParameters(_parameters);
  };

  const handleContentTypeChange = (ruleId: string, newContentTypeId: string) => {
    const newContentTypeRules = contentTypeRules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            contentTypeId: newContentTypeId,
            slugField: '',
            additionalFieldIds: [],
          }
        : rule
    );

    contentTypeRulesHandler(newContentTypeRules);
  };

  const handleContentTypeFieldChange = (
    ruleId: string,
    field: string,
    value: string | boolean | string[]
  ) => {
    const newContentTypeRules = contentTypeRules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            [field]: value,
          }
        : rule
    );

    contentTypeRulesHandler(newContentTypeRules);
  };

  const handleContentTypeRuleChange = (ruleId: string, updates: Partial<ContentTypeRule>) => {
    const newContentTypeRules = contentTypeRules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            ...updates,
          }
        : rule
    );

    contentTypeRulesHandler(newContentTypeRules);
  };

  const handleAddContentType = () => {
    contentTypeRulesHandler([...contentTypeRules, createDefaultRule()]);
  };

  const handleRemoveContentType = (ruleId: string) => {
    contentTypeRulesHandler(contentTypeRules.filter((rule) => rule.id !== ruleId));
  };

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <Box>
        <Subheading marginBottom="spacingXs">Content type configuration</Subheading>
        <Paragraph>
          Configure content types below that are connected to pages on your website where you're
          tracking Google Analytics data. You'll need to specify the "slug" field used to generate
          the page path in your website's URL, and optionally a "prefix" if one exists in front of
          the URL page path. Additionally, you can check the box below to append a trailing slash to
          all URLs if needed. The app will automatically be added to the sidebar of associated
          content types on save of the configuration.
        </Paragraph>
        <Paragraph>
          <TextLink
            href="https://www.contentful.com/help/google-analytics-4-app/"
            target="_blank"
            icon={<ExternalLinkIcon />}
            alignIcon="end">
            See our help documentation for more details
          </TextLink>
        </Paragraph>
        <Checkbox
          name="use-trailing-slash"
          id="use-trailing-slash"
          isChecked={forceTrailingSlash}
          onChange={trailingSlashHandler}>
          Use trailing slash for all page paths
        </Checkbox>
        <Paragraph marginTop="spacing2Xs" marginBottom="none">
          Applies to standard configurations only. Advanced patterns are used exactly as written.
        </Paragraph>
      </Box>
      {!loadingContentTypes && !loadingAllContentTypes ? (
        <>
          {hasContentTypes && (
            <AssignContentTypeCard
              allContentTypes={allContentTypes}
              allContentTypeEntries={allContentTypeEntries}
              contentTypeRules={contentTypeRules}
              onContentTypeChange={handleContentTypeChange}
              onContentTypeFieldChange={handleContentTypeFieldChange}
              onContentTypeRuleChange={handleContentTypeRuleChange}
              onRemoveContentType={handleRemoveContentType}
              currentEditorInterface={currentEditorInterface}
              originalContentTypeRules={originalContentTypeRules}
              rulesMissingPattern={rulesMissingPattern}
            />
          )}
          {contentTypeRules.length < Object.keys(allContentTypes).length * 5 && (
            <Button onClick={handleAddContentType} isDisabled={hasIncompleteContentTypes}>
              Add a rule
            </Button>
          )}
        </>
      ) : (
        <Flex fullWidth={true}>
          <Skeleton.Container>
            <Skeleton.BodyText numberOfLines={6} />
          </Skeleton.Container>
        </Flex>
      )}
    </Stack>
  );
};

export default AssignContentTypeSection;
