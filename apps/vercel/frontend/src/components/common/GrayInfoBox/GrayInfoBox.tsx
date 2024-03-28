import React from 'react';
import { CopyIcon } from '@contentful/f36-icons';
import { Flex, IconButton, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

import { useStyles } from './GrayInfoBox.styles';

interface Props {
  children: string;
  withCopy?: boolean;
  rootStylingOptions?: React.CSSProperties;
}

export const GrayInfoBox = ({ children, withCopy, rootStylingOptions }: Props) => {
  const styles = useStyles(rootStylingOptions);
  const handleCopyClick = () => {
    navigator.clipboard.writeText(children);
  };

  return (
    <Flex data-testid="info-box" className={styles.root} alignItems="center" gap={tokens.spacingXs}>
      <Paragraph className={styles.paragraph}>
        {children}
        {withCopy && (
          <IconButton
            onClick={handleCopyClick}
            className={styles.copyButton}
            icon={<CopyIcon variant="muted" />}
            aria-label={'Copy text'}
          />
        )}
      </Paragraph>
    </Flex>
  );
};
