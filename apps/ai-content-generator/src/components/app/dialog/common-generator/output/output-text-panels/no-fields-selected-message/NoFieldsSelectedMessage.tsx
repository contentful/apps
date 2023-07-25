import { Button, Flex, TextInput } from '@contentful/f36-components';

const NoFieldsSelectedMessage = () => {
  return (
    <Flex margin="spacingL" flexDirection="column" flexGrow={5}>
      <Flex flexDirection="column">
        <TextInput isDisabled value="Select source and output fields before generating text" />
        <Flex alignSelf="flex-end" marginTop="spacingS">
          <Button isDisabled>Generate</Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default NoFieldsSelectedMessage;
