import { useEffect, useState } from 'react';
import { Card, Flex, HelpText, Subheading, Text } from '@contentful/f36-components';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { styles } from './GettingStartedSection.styles';

import configPageCopies from 'constants/configPageCopies';

import gettingstarted1 from '../../../assets/gettingstarted-1.png';
import gettingstarted2 from '../../../assets/gettingstarted-2.png';
import gettingstarted3 from '../../../assets/gettingstarted-3.png';
import gettingstarted4 from '../../../assets/gettingstarted-4.png';
import Hyperlink from '../Hyperlink/Hyperlink';
import TryContentGeneratorButton from './TryContentGeneratorButton';

const GettingStartedSection = ({ sdk }: { sdk: ConfigAppSDK }) => {
  const [appIsInstalled, setAppIsInstalled] = useState<boolean>(false);
  const {
    sectionTitle,
    sectionSubheading1,
    sectionSubheading2,
    linkBody,
    linkSubstring,
    linkHref,
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
        <Subheading>{sectionTitle}</Subheading>
        <Text fontSize="fontSizeM" fontWeight="fontWeightNormal" fontColor="gray900">
          {sectionSubheading1}
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
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={gettingstarted1} alt="AI generator dialog" />
        </Card>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={gettingstarted2} alt="AI generator modal prompt" />
        </Card>
      </Flex>
      <Flex marginTop="spacingL">
        <Text fontWeight="fontWeightMedium" fontColor="gray900">
          {sectionSubheading2}
        </Text>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={gettingstarted3} alt="AI genertaed pug" />
        </Card>
      </Flex>
      <Flex marginTop="spacingL">
        <Card className={styles.box}>
          <img src={gettingstarted4} alt="AI genertaed pug edit mask" />
        </Card>
      </Flex>
    </Flex>
  );
};

export default GettingStartedSection;
