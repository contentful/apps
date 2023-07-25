import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { Button, Flex, TextInput } from '@contentful/f36-components';

interface Props {
  feature: AIFeature;
}

const NoFieldsSelectedMessage = (props: Props) => {
  const { feature } = props;
  const inputCopy = featureConfig[feature].description;

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
