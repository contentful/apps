import * as React from 'react';
import styled from '@emotion/styled';
import {
  Typography,
  Heading,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import Section from './section';
import { useNetlify } from '~/providers/netlify-provider';
import { useSdk } from '~/providers/sdk-provider';

const DeployInfoItem = styled(Paragraph)`
  margin-bottom: 16px;

  & > code {
    display: inline-block;

    padding: 3px 5px;
    font-size: 14px;
    letter-spacing: 1.5px;
    font-family: inherit;
    color: #8391a3;

    background-color: #fafafa;
    border-radius: 3px;
  }
`;

const ConfigDeploy: React.FC = () => {
  const netlify = useNetlify();
  const sdk = useSdk();

  return (
    <Section isDisabled={!netlify.isReady}>
      <Typography>
        <Heading>2. Deploy website</Heading>
        <Paragraph>You’ll need the following to deploy:</Paragraph>
      </Typography>
      <DeployInfoItem>
        <strong>Space ID:</strong> <code>{sdk.instance.ids.space}</code>
      </DeployInfoItem>
      <DeployInfoItem>
        <strong>Content Delivery API - access token</strong>{' '}
        <TextLink
          target="_blank"
          rel="noopener noreferrer"
          href={`https://app.contentful.com/spaces/${sdk.instance.ids.space}/api/keys`}
        >
          get one here
        </TextLink>
      </DeployInfoItem>
      <DeployInfoItem>
        <strong>Content Preview API - access token</strong>{' '}
        <TextLink
          target="_blank"
          rel="noopener noreferrer"
          href={`https://app.contentful.com/spaces/${sdk.instance.ids.space}/api/keys`}
        >
          get one here
        </TextLink>
      </DeployInfoItem>
      <a
        href="https://app.netlify.com/start/deploy?repository=https://github.com/contentful-labs/gatsby-starter-contentful-knowledge-base"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://www.netlify.com/img/deploy/button.svg"
          alt="Deploy to Netlify"
        />
      </a>
    </Section>
  );
};

export default ConfigDeploy;
