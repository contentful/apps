import { Flex, HelpText, Subheading, Text } from '@contentful/f36-components';
import configPageCopies from 'constants/configPageCopies';
import { HyperLink } from '@contentful/integration-component-library';
import { styles } from './CostSection.styles';
import { ExternalLinkIcon } from '@contentful/f36-icons';

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
    learnBodyHref,
    learnMoreBody,
    learnMoreSubstring,
  } = configPageCopies.costSection;
  return (
    <Flex className={styles.wrapper} flexDirection="column">
      <Subheading>{sectionTitle}</Subheading>
      <Text className={styles.header} fontWeight="fontWeightMedium" fontColor="gray900">
        {sectionSubheading}
      </Text>
      <HelpText className={styles.link}>
        <HyperLink
          body={pricingLinkBody}
          substring={pricingLinkSubstring}
          href={pricingLinkHref}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </HelpText>
      <HelpText className={styles.link}>
        <HyperLink
          body={creditLinkBody}
          substring={creditLinkSubstring}
          href={creditLinkHref}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </HelpText>
      <HelpText className={styles.link}>
        <HyperLink
          body={learnMoreBody}
          substring={learnMoreSubstring}
          href={learnBodyHref}
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </HelpText>
    </Flex>
  );
};

export default CostSection;
