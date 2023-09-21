import { useEffect, useState } from 'react';
import { Card, Flex, HelpText, Text } from '@contentful/f36-components';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { styles } from './GettingStartedSection.styles';

import configPageCopies from 'constants/configPageCopies';

import getstarted1 from '../../../assets/get-started-1.jpg';
import getstarted2 from '../../../assets/get-started-2.jpg';
import Hyperlink from '../Hyperlink/Hyperlink';
import TryContentGeneratorButton from './TryContentGeneratorButton';

const GettingStartedSection = ({ sdk }: { sdk: ConfigAppSDK }) => {
  const [appIsInstalled, setAppIsInstalled] = useState<boolean>(false);
  const {
    sectionTitle,
    sectionTitle2,
    sectionTitle3,
    sectionSubheading1,
    sectionSubheading2,
    linkBody,
    linkHref,
    linkSubstring,
  } = configPageCopies.gettingStartedSection;

  useEffect(() => {
    async function checkAppIsInstalled() {
      const installed = await sdk.app.isInstalled();
      if (installed) {
        setAppIsInstalled(true);
      }
    }
    checkAppIsInstalled();
  }, [sdk]);

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
          {sectionTitle}
        </Text>
      </Flex>
      {appIsInstalled && (
        <Flex marginTop="spacingL">
          <TryContentGeneratorButton />
          <HelpText>
            <Hyperlink body={linkBody} substring={linkSubstring} href={linkHref} />
          </HelpText>
        </Flex>
      )}
      <Flex flexDirection="column">
        <Text marginTop="spacingM" fontSize="fontSizeM" fontWeight="fontWeightDemiBold">
          {sectionTitle2}
        </Text>
        <Text
          marginTop="spacingM"
          fontSize="fontSizeM"
          fontWeight="fontWeightNormal"
          fontColor="gray900">
          {sectionSubheading1}
        </Text>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={getstarted1} alt="AI generator dialog" />
        </Card>
      </Flex>
      <Flex marginTop="spacingXl" flexDirection="column">
        <Text marginTop="spacingM" fontSize="fontSizeM" fontWeight="fontWeightDemiBold">
          {sectionTitle3}
        </Text>
        <Text
          marginTop="spacingM"
          fontSize="fontSizeM"
          fontWeight="fontWeightNormal"
          fontColor="gray900">
          {sectionSubheading2}
        </Text>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={getstarted2} alt="AI generator modal prompt" />
        </Card>
      </Flex>
    </Flex>
  );
};

export default GettingStartedSection;
