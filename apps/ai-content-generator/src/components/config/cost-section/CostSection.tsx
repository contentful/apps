import { Flex, Paragraph, Subheading, Text } from '@contentful/f36-components';
import { Sections } from '../configText';
import Hyperlink from '@components/common/HyperLink/HyperLink';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const CostSection = () => {
  const { costHeading, costSubheading, costDescription, costLink, costLinkSubstring } = Sections;
  return (
    <Flex flexDirection="column">
      <Subheading>{costHeading}</Subheading>
      <Text fontWeight="fontWeightMedium" fontColor="gray900">
        {costSubheading}
      </Text>
      <Paragraph marginBottom="none" marginTop="spacingXs">
        <Hyperlink
          body={costDescription}
          substring={costLinkSubstring}
          hyperLinkHref={costLink}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Paragraph>
    </Flex>
  );
};

export default CostSection;
