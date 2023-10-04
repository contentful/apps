import { Flex, Subheading, Text } from '@contentful/f36-components';
import { HyperLink } from '@contentful/integration-component-library';
import { Sections } from '../configText';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const DisclaimerSection = () => {
  const { disclaimerHeading, disclaimerDescription, disclaimerLink, disclaimerLinkSubstring } =
    Sections;
  return (
    <Flex flexDirection="column">
      <Subheading>{disclaimerHeading}</Subheading>
      <Text fontSize="fontSizeM" fontWeight="fontWeightMedium" fontColor="gray900">
        <HyperLink
          body={disclaimerDescription}
          substring={disclaimerLinkSubstring}
          hyperLinkHref={disclaimerLink}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Text>
    </Flex>
  );
};

export default DisclaimerSection;
