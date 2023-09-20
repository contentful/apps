import { Flex, Subheading, Text } from '@contentful/f36-components';
import Hyperlink from 'components/config/Hyperlink/Hyperlink';
import configPageCopies from 'constants/configPageCopies';

const DisclaimerSection = () => {
  const { sectionTitle, linkBody, linkSubstring, linkHref } = configPageCopies.disclaimerSection;
  return (
    <Flex flexDirection="column">
      <Subheading>{sectionTitle}</Subheading>
      <Text fontSize="fontSizeM" fontWeight="fontWeightNormal" fontColor="gray900">
        <Hyperlink body={linkBody} substring={linkSubstring} href={linkHref} />
      </Text>
    </Flex>
  );
};

export default DisclaimerSection;
