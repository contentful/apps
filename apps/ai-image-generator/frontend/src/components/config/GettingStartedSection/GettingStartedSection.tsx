import { Card, Flex, Text } from '@contentful/f36-components';
import { styles } from './GettingStartedSection.styles';

import configPageCopies from 'constants/configPageCopies';

import getStartedImageGeneration from '../../../assets/getStartedImageGeneration.jpg';
import getStartedSelectAndEdit from '../../../assets/getStartedSelectAndEdit.jpg';

import TryImageGeneratorButton from './TryImageGeneratorButton';
import { TextLink } from '@contentful/f36-components';

const GettingStartedSection = ({ appIsInstalled }: { appIsInstalled?: boolean }) => {
  const {
    sectionTitle,
    generateImageSubtitle: sectionSubTitle1,
    selectAndEditSubtitle: sectionSubTitle2,
    sectionSubHeading1,
    sectionSubHeading2,
    linkBody,
    linkHref,
  } = configPageCopies.gettingStartedSection;

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
          {sectionTitle}
        </Text>
      </Flex>
      <Flex flexDirection="column">
        <Text marginTop="spacingM" fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
          {sectionSubTitle1}
        </Text>
        <Text
          marginTop="spacingS"
          fontSize="fontSizeM"
          fontWeight="fontWeightNormal"
          fontColor="gray900">
          {sectionSubHeading1}
        </Text>
        {appIsInstalled && (
          <Flex marginTop="spacingL" alignItems="center">
            <TryImageGeneratorButton />
            <TextLink href={linkHref}>{linkBody}</TextLink>
          </Flex>
        )}
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={getStartedImageGeneration} alt="AI generator dialog" />
        </Card>
      </Flex>
      <Flex marginTop="spacingL" flexDirection="column">
        <Text marginTop="spacingM" fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
          {sectionSubTitle2}
        </Text>
        <Text
          marginTop="spacingS"
          fontSize="fontSizeM"
          fontWeight="fontWeightNormal"
          fontColor="gray900">
          {sectionSubHeading2}
        </Text>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={getStartedSelectAndEdit} alt="AI generator modal prompt" />
        </Card>
      </Flex>
    </Flex>
  );
};

export default GettingStartedSection;
