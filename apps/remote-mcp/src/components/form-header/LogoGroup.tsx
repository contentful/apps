import { type FC } from 'react';
import { Flex } from '@contentful/f36-components';
import mcpLogo from '../../assets/logo.png';
import { CodeIcon } from './CodeIcon';
import { ContentfulLogo } from './ContentfulLogo';

export const LogoGroup: FC = () => (
  <Flex
    justifyContent="center"
    alignItems="center"
    gap="spacingXs"
    style={{ marginBottom: '12px' }}
  >
    <img
      src={mcpLogo}
      alt="MCP Logo"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '6px',
      }}
    />
    <CodeIcon />
    <ContentfulLogo />
  </Flex>
);
