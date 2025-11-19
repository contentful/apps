import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { ContentTypeProps } from 'contentful-management';
import { Flex, Heading, Paragraph, Box, Button, Tooltip } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import OverrideRow from './OverrideRow';
import { Override, OverrideState } from '../utils/types';

type ContentTypeOverridesProps = {
  overrides: Override[];
  overridesAreInvalid?: OverrideState;
  onOverridesChange: (updater: (prev: Override[]) => Override[]) => void;
};

const ContentTypeOverrides: React.FC<ContentTypeOverridesProps> = ({
  overrides,
  overridesAreInvalid,
  onOverridesChange,
}) => {
  const sdk = useSDK<ConfigAppSDK>();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const contentTypesResponse = await sdk.cma.contentType.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        });

        setContentTypes(contentTypesResponse.items);
      } catch (error) {
        console.warn('[Error] Failed to load content types:', error);
      }
    })();
  }, [sdk]);

  const maxOverridesReached = () => {
    return (
      contentTypes.every((ct) => overrides.some((o) => o.contentTypeId === ct.sys.id)) ||
      contentTypes.length <= overrides.length
    );
  };

  const addOverride = () => {
    onOverridesChange((prev) => [
      ...prev,
      { id: window.crypto.randomUUID(), contentTypeId: '', fieldId: '' },
    ]);
  };

  const handleOverrideChange = (updatedOverride: Override) => {
    onOverridesChange((prev) =>
      prev.map((override) => (override.id === updatedOverride.id ? updatedOverride : override))
    );
  };

  const handleOverrideDelete = (overrideId: string) => {
    onOverridesChange((prev) => prev.filter((o) => o.id !== overrideId));
  };

  return (
    <Flex flexDirection="column" fullWidth>
      <Heading as="h3">Overrides</Heading>
      <Paragraph>
        If an override is needed per content type, select the content type and the field name you
        wish to use for each entry.
      </Paragraph>
      {overrides?.map((override) => (
        <OverrideRow
          key={override.id}
          contentTypes={contentTypes}
          overrideItem={override}
          overrideIsInvalid={overridesAreInvalid?.[override.id]}
          overrides={overrides}
          onOverrideChange={handleOverrideChange}
          onOverrideDelete={handleOverrideDelete}
        />
      ))}
      <Box marginBottom="spacingXl">
        <Tooltip
          placement="right"
          id="tooltip-1"
          content={maxOverridesReached() ? 'No more content types available.' : undefined}>
          <Button
            aria-label="Add override"
            startIcon={<PlusIcon />}
            isDisabled={maxOverridesReached()}
            onClick={addOverride}>
            Add override
          </Button>
        </Tooltip>
      </Box>
    </Flex>
  );
};

export default ContentTypeOverrides;
