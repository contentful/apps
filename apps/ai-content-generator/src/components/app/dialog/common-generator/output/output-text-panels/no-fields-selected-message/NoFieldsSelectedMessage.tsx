import { useContext } from 'react';
import { GeneratorContext } from '@providers/generatorProvider';
import featureConfig from '@configs/features/featureConfig';
import { Button, Flex, TextInput } from '@contentful/f36-components';

const NoFieldsSelectedMessage = () => {
  const { feature } = useContext(GeneratorContext);
  const inputCopy = featureConfig[feature].messageSuffix;

  return (
    <Flex margin="spacingL" flexDirection="column" flexGrow={5}>
      <Flex flexDirection="column">
        <TextInput isDisabled value={`Select source and output fields in order to ${inputCopy}`} />
        <Flex alignSelf="flex-end" marginTop="spacingS">
          <Button isDisabled>Generate</Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default NoFieldsSelectedMessage;
