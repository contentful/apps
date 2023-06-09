import { useEffect, useState } from 'react';
import { Box, Button, Flex, IconButton, Paragraph, Subheading } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { styles } from './Dialog.styles';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import fetchWithSignedRequest from 'helpers/signedRequests';
import { config } from 'config';

interface Props {
  onSave: () => void;
  headerText: string;
  resourceCountText: string;
}

const DialogHeader = (props: Props) => {
  const [logoUrl, setLogoUrl] = useState<string>();

  const sdk = useSDK<DialogAppSDK>();
  const cma = useCMA();

  const { onSave, headerText, resourceCountText } = props;

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(`${config.backendApiUrl}/api/config.json`);

        const res = await fetchWithSignedRequest(url, sdk.ids.app!, cma, sdk, 'GET');

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const data = await res.json();

        setLogoUrl(data.logoUrl);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, [sdk, cma]);

  return (
    <Flex justifyContent="space-between" alignItems="center" className={styles.header}>
      <Flex alignItems="center">
        <Box className={styles.icon} paddingRight="spacingS">
          {logoUrl && <img src={logoUrl} alt="App logo" />}
        </Box>
        <Subheading marginBottom="none">{headerText}</Subheading>
      </Flex>
      <Flex alignItems="center">
        <Paragraph marginBottom="none">{resourceCountText}</Paragraph>
        <Box paddingLeft="spacingS">
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
        </Box>
        <Box>
          <IconButton
            variant="transparent"
            aria-label="Close dialog"
            icon={<CloseIcon />}
            size="large"
            onClick={() => sdk.close()}
          />
        </Box>
      </Flex>
    </Flex>
  );
};

export default DialogHeader;
