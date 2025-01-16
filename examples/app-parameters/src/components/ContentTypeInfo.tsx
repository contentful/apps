import { SidebarAppSDK } from '@contentful/app-sdk';
import { Button, Flex, Paragraph, Subheading, Tooltip } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useState } from 'react';
import { styles } from './ContentTypeInfo.styles';
import { CopyIcon } from '@contentful/f36-icons';

const ContentTypeInfo = () => {
  const [contentTypeIDIsCopied, setContentTypeIDIsCopied] = useState(false);
  const sdk = useSDK<SidebarAppSDK>();
  const {
    name,
    description,
    sys: { id },
  } = sdk.contentType;

  const copyContentTypeID = useCallback(async () => {
    await window.navigator.clipboard.writeText(id);
    setContentTypeIDIsCopied(true);
  }, [sdk.contentType]);

  return (
    <>
      <Flex alignItems="center" justifyContent="space-between" marginBottom="spacingS">
        <Subheading marginBottom="none">{name}</Subheading>
        <Tooltip
          className={styles.copyButtonWrapper}
          content={contentTypeIDIsCopied ? 'Copied!' : 'Copy to clipboard.'}
          placement="left">
          <Button
            variant="transparent"
            startIcon={<CopyIcon />}
            onClick={copyContentTypeID}
            onBlur={() => {
              setContentTypeIDIsCopied(false);
            }}
            className={styles.copyIDButton}
            size="small">
            Copy ID
          </Button>
        </Tooltip>
      </Flex>
      <Paragraph fontColor="gray500">{description}</Paragraph>
    </>
  );
};

export default ContentTypeInfo;
