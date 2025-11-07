import { FieldAppSDK } from '@contentful/app-sdk';
import { Box, Button, ButtonGroup, Flex, IconButton } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ArrowCounterClockwiseIcon } from '@contentful/f36-icons';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { styles } from './Field.styles';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  useAutoResizer();
  const locales = sdk.locales;

  const handleRefetch = () => {
    console.log('Refetch value from parent');
  };

  const handleClear = async () => {
    await sdk.field.setValue('');
  };

  return (
    <Flex marginBottom="none" fullWidth>
      <Box marginRight="spacingS" className={styles.editor}>
        <SingleLineEditor field={sdk.field} locales={locales} withCharValidation />
      </Box>
      <Flex alignItems="flex-start">
        <ButtonGroup variant="spaced" spacing="spacingS">
          <IconButton
            variant="secondary"
            aria-label="Refetch value from parent"
            title="Refetch value from parent"
            icon={<ArrowCounterClockwiseIcon />}
            onClick={handleRefetch}
          />
          <Button
            variant="negative"
            aria-label="Clear value"
            title="Clear value"
            onClick={handleClear}>
            Clear
          </Button>
        </ButtonGroup>
      </Flex>
    </Flex>
  );
};

export default Field;
