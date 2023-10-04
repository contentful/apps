import { Flex, HelpText, Subheading, Text } from '@contentful/f36-components';
import configPageCopies from 'constants/configPageCopies';
import { HyperLink } from '@contentful/integration-component-library';
import { styles } from './CostSection.styles';

const CostSection = () => {
  const {
    sectionTitle,
    sectionSubheading,
    pricingLinkBody,
    pricingLinkSubstring,
    pricingLinkHref,
    creditLinkBody,
    creditLinkSubstring,
    creditLinkHref,
  } = configPageCopies.costSection;
  return (
    <Flex className={styles.wrapper} flexDirection="column">
      <Subheading>{sectionTitle}</Subheading>
      <Text fontWeight="fontWeightMedium" fontColor="gray900">
        {sectionSubheading}
      </Text>
      <HelpText className={styles.link}>
        <HyperLink
          body={pricingLinkBody}
          substring={pricingLinkSubstring}
          hyperLinkHref={pricingLinkHref}
        />
      </HelpText>
      <HelpText className={styles.link}>
        <HyperLink
          body={creditLinkBody}
          substring={creditLinkSubstring}
          hyperLinkHref={creditLinkHref}
        />
      </HelpText>
    </Flex>
  );
};

export default CostSection;
