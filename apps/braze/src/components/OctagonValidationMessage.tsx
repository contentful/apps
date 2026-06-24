import { Flex, Text } from '@contentful/f36-components';
import { useDensity } from '@contentful/f36-utils';
import { WarningOctagonIcon } from '@contentful/f36-icons';

type Props = {
  children: string;
};
const OctagonValidationMessage = (props: Props) => {
  const density = useDensity();

  return (
    <Flex marginTop="spacing2Xs" alignItems="center" aria-live="assertive">
      <Flex marginRight={density === 'high' ? 'spacing2Xs' : 'spacingXs'}>
        <WarningOctagonIcon />
      </Flex>
      <Text
        as="p"
        fontColor="red600"
        fontSize={density === 'high' ? 'fontSizeMHigh' : 'fontSizeM'}
        lineHeight={density === 'high' ? 'lineHeightMHigh' : 'lineHeightM'}>
        {props.children}
      </Text>
    </Flex>
  );
};

export default OctagonValidationMessage;
