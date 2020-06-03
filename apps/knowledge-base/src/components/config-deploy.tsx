import * as React from 'react';
import styled from '@emotion/styled';
import {
  Typography,
  Heading,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';
import Section from './section';
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

const AlreadyDeployedText = styled(Paragraph)`
  margin-top: 32px;

  font-size: 14px;
`;

interface ConfigDeployProps {
  onClickDeploy: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  isEnabled: boolean;
}

const ConfigDeploy: React.FC<ConfigDeployProps> = (props) => {
  const sdk = useSdk();

  return (
    <Section isEnabled={props.isEnabled}>
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
        onClick={props.onClickDeploy}
      >
        <img
          src="https://www.netlify.com/img/deploy/button.svg"
          alt="Deploy to Netlify"
        />
      </a>

      <AlreadyDeployedText>
        <TextLink
          href="#"
          onClick={(event) => {
            event.preventDefault();

            props.onClickDeploy(event);
          }}
        >
          Already deployed?
        </TextLink>
      </AlreadyDeployedText>
    </Section>
  );
};

export default ConfigDeploy;
