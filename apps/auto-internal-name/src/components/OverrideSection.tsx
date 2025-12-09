import { useMemo } from 'react';
import { ContentTypeProps } from 'contentful-management';
import { Flex, Heading, Paragraph, Box, Button, Tooltip } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import OverrideRow from './OverrideRow';
import { Override, OverrideState } from '../utils/types';

type ContentTypeOverridesProps = {
  contentTypes: ContentTypeProps[];
  overrides: Override[];
  overridesAreInvalid?: OverrideState;
  onOverridesChange: (newOverrides: Override[]) => void;
};

const OverrideSection: React.FC<ContentTypeOverridesProps> = ({
  contentTypes,
  overrides,
  overridesAreInvalid,
  onOverridesChange,
}: ContentTypeOverridesProps) => {
  const maxOverridesReached = useMemo(() => {
    return (
      contentTypes.every((ct) => overrides.some((o) => o.contentTypeId === ct.sys.id)) ||
      contentTypes.length <= overrides.length
    );
  }, [contentTypes, overrides]);

  const addOverride = () => {
    onOverridesChange([
      ...overrides,
      { id: window.crypto.randomUUID(), contentTypeId: '', fieldId: '' },
    ]);
  };

  const handleOverrideChange = (override: Override, contentTypeId?: string, fieldId?: string) => {
    const newContentTypeId = contentTypeId || contentTypeId === '' ? { contentTypeId } : undefined;
    const newFieldId = fieldId || fieldId === '' ? { fieldId } : undefined;

    const newOverride = { ...override, ...newContentTypeId, ...newFieldId };

    onOverridesChange(overrides.map((o) => (o.id === newOverride.id ? newOverride : o)));
  };

  const handleOverrideDelete = (overrideId: string) => {
    onOverridesChange(overrides.filter((o) => o.id !== overrideId));
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
          onOverrideChange={(override, contentTypeId, fieldId) =>
            handleOverrideChange(override, contentTypeId, fieldId)
          }
          onOverrideDelete={handleOverrideDelete}
        />
      ))}
      <Box marginBottom="spacingXl">
        <Tooltip
          placement="right"
          id="tooltip-1"
          content={maxOverridesReached ? 'No more content types available.' : undefined}>
          <Button
            aria-label="Add override"
            startIcon={<PlusIcon />}
            isDisabled={maxOverridesReached}
            onClick={addOverride}>
            Add override
          </Button>
        </Tooltip>
      </Box>
    </Flex>
  );
};

export default OverrideSection;
