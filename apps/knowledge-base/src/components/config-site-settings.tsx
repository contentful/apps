import * as React from 'react';
import styled from '@emotion/styled';
import Section from './section';
import {
  Typography,
  Heading,
  Paragraph,
  SelectField,
  Spinner,
  TextLink,
  Button,
} from '@contentful/forma-36-react-components';
import { useNetlify } from '~/providers/netlify-provider';

const SelectContainer = styled.div`
  display: grid;
  grid-template-columns: 50% auto;
  column-gap: 20px;
  align-items: end;
`;

const HelpText = styled(Paragraph)`
  margin-bottom: 16px;
`;

interface ConfigSiteSettingsProps {
  netlifySelectedSiteId: string;
  onChangeNetlifySite: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isEnabled: boolean;
}

const ConfigSiteSettings: React.FC<ConfigSiteSettingsProps> = (props) => {
  const netlify = useNetlify();

  function handleOnRefreshWebsitesList(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();

    netlify.getNetlifySites();
  }

  return (
    <Section isEnabled={props.isEnabled}>
      <Typography>
        <Heading>3. Enable preview and manual deploys</Heading>
        <Paragraph>
          Select a Netlify site from the list to enable content preview and
          manual deploys.
        </Paragraph>
      </Typography>

      {!netlify.isReady && (
        <Button
          onClick={() => netlify.authorize()}
          disabled={netlify.isLoading || netlify.isReady}
        >
          {netlify.isLoading && <Spinner color="white" />} Connect to Netlify
        </Button>
      )}

      {netlify.isReady && (
        <HelpText>
          Don&apos;t see your site?{' '}
          <TextLink onClick={handleOnRefreshWebsitesList}>Refresh</TextLink>{' '}
          {netlify.isLoadingSites && <Spinner size="small" />}
        </HelpText>
      )}

      {netlify.isReady && (
        <SelectContainer>
          <div>
            <SelectField
              id="netlify-websites"
              name="netlify-websites"
              labelText="Select Netlify site"
              required
              value={props.netlifySelectedSiteId ?? '0'}
              onChange={props.onChangeNetlifySite}
            >
              <option disabled={true} value="0">
                Select site
              </option>
              {netlify.sites.map((site, index) => (
                <option
                  key={index}
                  value={site.site_id}
                  disabled={netlify.isLoadingBuildHooks}
                >
                  {site.name}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            {(netlify.isLoadingBuildHooks || netlify.isLoadingSites) && (
              <Spinner />
            )}
          </div>
        </SelectContainer>
      )}
    </Section>
  );
};

export default ConfigSiteSettings;
