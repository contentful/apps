import { Flex, HelpText, Subheading, Text } from '@contentful/f36-components';
import configPageCopies from 'constants/configPageCopies';
import Hyperlink from '../Hyperlink/Hyperlink';
import { styles } from './CostSection.styles';

const CostSection = () => {
    const { sectionTitle, sectionSubheading, pricingLinkBody, pricingLinkSubstring, pricingLinkHref, creditLinkBody, creditLinkSubstring, creditLinkHref } = configPageCopies.costSection;
    return (
        <Flex className={styles.wrapper} flexDirection='column'>
            <Subheading>{sectionTitle}</Subheading>
            <Text fontWeight='fontWeightMedium' fontColor='gray900'>{sectionSubheading}</Text>
            <HelpText className={styles.link}>
                <Hyperlink body={pricingLinkBody} substring={pricingLinkSubstring} href={pricingLinkHref} />
            </HelpText>
            <HelpText className={styles.link}>
                <Hyperlink body={creditLinkBody} substring={creditLinkSubstring} href={creditLinkHref} />
            </HelpText>
        </Flex>
    )

}


export default CostSection;