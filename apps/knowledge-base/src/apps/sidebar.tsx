import * as React from 'react';
import {
  Paragraph,
  Button as FormaButton,
  Spinner,
} from '@contentful/forma-36-react-components';
import styled from '@emotion/styled';
import { useNetlify } from '../providers/netlify-provider';
import { useSdk } from '../providers/sdk-provider';

const { useEffect, useState } = React;

const Button = styled(FormaButton)<{
  target?: string;
}>`
  margin-bottom: 16px;
`;

const Text = styled(Paragraph)`
  color: #888;
  font-size: 12px;
`;

const Sidebar: React.FC = () => {
  const sdk = useSdk();
  const netlify = useNetlify();
  const params: Record<string, any> = sdk.instance.parameters.installation;
  const { id: entryId } = sdk.instance.entry.getSys();
  const buildHookUrl = params.netlifySelectedSiteBuildHookUrl;
  const siteUrl = params.netlifySelectedSiteUrl;
  const siteId = params.netlifySelectedSiteId;
  const [lastReadyBuild, setLastReadyBuild] = useState<Record<string, any>>({});
  const [currentBuild, setCurrentBuild] = useState<Record<string, any>>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const lastBuildDate = isBuilding
    ? currentBuild?.created_at
    : lastReadyBuild?.created_at;

  useEffect(() => {
    sdk.instance.window.startAutoResizer();
    loadDeploys();
  }, []);

  useEffect(() => {
    if (!isBuilding) return;

    const interval = setInterval(loadDeploys, 7000);
    return () => {
      clearInterval(interval);
    };
  }, [isBuilding]);

  async function handleOnBuildWebsite() {
    setIsBuilding(true);

    const res = await fetch(buildHookUrl, {
      method: 'POST',
    });
    if (!res.ok) return;

    loadDeploys();
  }

  async function loadDeploys() {
    const deploys = await netlify.getDeploysBySiteId(siteId);
    const ready = deploys.find((deploy) => deploy.state === 'ready');
    const build = deploys.find((deploy) =>
      ['enqueued', 'building', 'uploading'].some(
        (status) => status === deploy.state
      )
    );

    setLastReadyBuild(ready);
    setCurrentBuild(build);
    setIsBuilding(!!build);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date(date));
  }

  if (!siteUrl && !buildHookUrl) {
    return (
      <Paragraph>
        No website was found. Please, go to the app settings to set one.
      </Paragraph>
    );
  }

  return (
    <div>
      {siteUrl && (
        <Button
          href={`${siteUrl}/preview?entry=${entryId}`}
          target="_blank"
          icon="ExternalLink"
          isFullWidth={true}
          buttonType="muted"
        >
          Open preview
        </Button>
      )}

      {buildHookUrl && (
        <Button
          onClick={handleOnBuildWebsite}
          type="button"
          disabled={isBuilding}
          isFullWidth={true}
        >
          {isBuilding ? (
            <span>
              Building... <Spinner color="white" size="small" />
            </span>
          ) : (
            'Build website'
          )}
        </Button>
      )}
      {!buildHookUrl && (
        <Text>
          We couldn&apos;t find your build url. Please, make sure you have
          selected and saved your website on the app settings and your website
          has a Build Hook named <b>Contentful</b> on Netlify.
        </Text>
      )}
      {lastBuildDate && (
        <Text>Last build triggered on {formatDate(lastBuildDate)}.</Text>
      )}
    </div>
  );
};

export default Sidebar;
