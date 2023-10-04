import { Flex, Subheading, Text } from '@contentful/f36-components';
import { HyperLink } from '@contentful/integration-component-library';
import configPageCopies from 'constants/configPageCopies';

const DisclaimerSection = () => {
  const { sectionTitle, linkBody, linkSubstring, linkHref } = configPageCopies.disclaimerSection;
  return (
    <Flex flexDirection="column">
      <Subheading>{sectionTitle}</Subheading>
      <Text fontSize="fontSizeM" fontWeight="fontWeightNormal" fontColor="gray900">
        <HyperLink body={linkBody} substring={linkSubstring} hyperLinkHref={linkHref} />
      </Text>
    </Flex>
  );
};

export default DisclaimerSection;
