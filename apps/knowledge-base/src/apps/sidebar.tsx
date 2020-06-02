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
  margin-bottom: 8px;
`;

const Text = styled(Paragraph)`
  margin: 4px 0;

  color: #888;
  font-size: 14px;
`;

const BuildButtonContainer = styled.div`
  margin-bottom: 16px;
`;

const ErrorText = styled(Text)`
  color: #d9453f;
`;

const Footer = styled.footer`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
`;

const Sidebar: React.FC = () => {
  const sdk = useSdk();
  const netlify = useNetlify();

  const [siteSettingsUrl, setSiteSettingsUrl] = useState('');
  const [currentBuild, setCurrentBuild] = useState<Record<string, any>>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const [hasBuildFailed, setHasBuildFailed] = useState(false);
  const [isLoadingDeployInfo, setIsLoadingDeployInfo] = useState(false);
  const [deployInfoFailed, setDeployInfoFailed] = useState(false);
  const [failedBuildReason, setFailedBuildReason] = useState();

  const params: Record<string, any> = sdk.instance.parameters.installation;
  const buildHookUrl = params.netlifySelectedSiteBuildHookUrl;
  const siteUrl = params.netlifySelectedSiteUrl;
  const siteId = params.netlifySelectedSiteId;

  const { id: entryId, contentType } = sdk.instance.entry.getSys();
  const shouldShowPreviewButton =
    !!siteUrl && contentType.sys.id === 'kbAppArticle';

  const hasWebsiteBeenBuilt =
    !deployInfoFailed && !isLoadingDeployInfo && !hasBuildFailed && !isBuilding;
  const hasBuildBeenFailed = hasBuildFailed && !isBuilding;

  useEffect(() => {
    sdk.instance.window.startAutoResizer();

    loadDeploys();

    sdk.getEntries({ content_type: 'kbAppSiteSettings' }).then((data) => {
      const url = data.items[0]
        ? `https://app.contentful.com/spaces/${sdk.instance.ids.space}/entries/${data.items[0].sys.id}`
        : '';

      setSiteSettingsUrl(url);
    });
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
    try {
      setIsLoadingDeployInfo(true);
      setDeployInfoFailed(false);

      const deploys = await netlify.getDeploysBySiteId(siteId);
      const hasBuildFailed = deploys[0].state === 'error';
      const isBuilding = ['enqueued', 'building', 'uploading'].some(
        (status) => status === deploys[0].state
      );

      setCurrentBuild(deploys[0]);
      setIsBuilding(isBuilding);
      setHasBuildFailed(hasBuildFailed);
      setFailedBuildReason(hasBuildFailed ? deploys[0].summary.status : '');
    } catch (err) {
      setDeployInfoFailed(true);
    } finally {
      setIsLoadingDeployInfo(false);
    }
  }

  function formatDate(date) {
    if (!date) return null;

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
      <ErrorText>
        No website was found. Go to the app settings to add one.
      </ErrorText>
    );
  }

  return (
    <div>
      {shouldShowPreviewButton && (
        <Button
          href={`${siteUrl}/preview?entry=${entryId}`}
          target="_blank"
          icon="ExternalLink"
          isFullWidth={true}
          buttonType="muted"
        >
          Preview article
        </Button>
      )}

      <BuildButtonContainer>
        {buildHookUrl && (
          <Button
            onClick={handleOnBuildWebsite}
            type="button"
            disabled={isBuilding}
            isFullWidth={true}
            buttonType="muted"
          >
            {isBuilding ? (
              <span>
                Building... <Spinner size="small" />
              </span>
            ) : (
              'Build website'
            )}
          </Button>
        )}
        {deployInfoFailed && (
          <ErrorText>
            We can&apos;t load your website deploy information, please make sure
            a Netlify account is connected to the app settings.
          </ErrorText>
        )}
        {!buildHookUrl && (
          <ErrorText>
            We couldn&apos;t find your build url. Please, make sure you have
            selected and saved your website on the app settings and your website
            has a Build Hook named <b>Contentful</b> on Netlify.
          </ErrorText>
        )}
        {hasBuildBeenFailed && (
          <ErrorText>
            Build failed on {formatDate(currentBuild.created_at)} Netlify
            reason: {failedBuildReason}.
          </ErrorText>
        )}
        {hasWebsiteBeenBuilt && (
          <Text>
            Built successfully on {formatDate(currentBuild.created_at)}.
          </Text>
        )}
      </BuildButtonContainer>

      {siteUrl && siteSettingsUrl && (
        <Footer>
          <Button
            href={siteUrl}
            target="_blank"
            icon="ExternalLink"
            isFullWidth={true}
            buttonType="naked"
          >
            Open website
          </Button>

          <Button
            href={siteSettingsUrl}
            target="_blank"
            icon="Settings"
            isFullWidth={true}
            buttonType="naked"
          >
            Site settings
          </Button>
        </Footer>
      )}
    </div>
  );
};

export default Sidebar;
