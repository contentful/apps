import * as React from 'react';
import {
  Paragraph,
  Button as FormaButton,
  Spinner,
  Icon,
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
  margin: 8px 0;

  color: #888;
  font-size: 12px;
`;

const SpinnerContainer = styled.div`
  text-align: center;
`;

const BuildButtonContainer = styled.div`
  margin-bottom: 16px;
`;

const TextWithIcon = styled(Text)`
  display: grid;
  grid-template-columns: 18px auto;
  column-gap: 4px;
  align-items: start;

  & > svg {
    margin-right: 4px;
  }
`;

const ErrorText = styled(TextWithIcon)`
  color: #d9453f;
`;

const SuccessText = styled(TextWithIcon)`
  color: #0eb87f;
`;

const Sidebar: React.FC = () => {
  const sdk = useSdk();
  const netlify = useNetlify();
  const params: Record<string, any> = sdk.instance.parameters.installation;
  const { id: entryId, contentType } = sdk.instance.entry.getSys();
  const buildHookUrl = params.netlifySelectedSiteBuildHookUrl;
  const siteUrl = params.netlifySelectedSiteUrl;
  const siteId = params.netlifySelectedSiteId;
  const [lastReadyBuild, setLastReadyBuild] = useState<Record<string, any>>({});
  const [currentBuild, setCurrentBuild] = useState<Record<string, any>>({});
  const [isBuilding, setIsBuilding] = useState(false);
  const [hasBuildFailed, setHasBuildFailed] = useState(false);
  const [isLoadingDeployInfo, setIsLoadingDeployInfo] = useState(false);
  const [deployInfoFailed, setDeployInfoFailed] = useState(false);
  const [failedBuildReason, setFailedBuildReason] = useState();
  const lastBuildDate = isBuilding
    ? currentBuild?.created_at
    : lastReadyBuild?.created_at;
  const shouldShowPreviewButton =
    !!siteUrl && contentType.sys.id === 'kbAppArticle';
  const hasWebsiteBeenBuilt =
    !deployInfoFailed && !isLoadingDeployInfo && !hasBuildFailed && !isBuilding;
  const hasBuildBeenFailed = hasBuildFailed && !isBuilding;

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
    try {
      setIsLoadingDeployInfo(true);
      setDeployInfoFailed(false);

      const deploys = await netlify.getDeploysBySiteId(siteId);
      const hasBuildFailed = deploys[0].state === 'error';
      const ready = deploys.find((deploy) => deploy.state === 'ready');
      const build = deploys.find((deploy) =>
        ['enqueued', 'building', 'uploading'].some(
          (status) => status === deploy.state
        )
      );

      setHasBuildFailed(hasBuildFailed);
      setFailedBuildReason(hasBuildFailed ? deploys[0].summary.status : '');
      setLastReadyBuild(ready);
      setCurrentBuild(build);
      setIsBuilding(!!build);
    } catch (err) {
      setDeployInfoFailed(true);
    } finally {
      setIsLoadingDeployInfo(false);
    }
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
      <ErrorText>
        <Icon icon="InfoCircle" color="negative" />
        <span>No website was found. Go to the app settings to add one.</span>
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
          Open preview
        </Button>
      )}

      <BuildButtonContainer>
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
        {isLoadingDeployInfo && (
          <SpinnerContainer>
            <Spinner size="small" />
          </SpinnerContainer>
        )}
        {deployInfoFailed && (
          <ErrorText>
            <Icon icon="ErrorCircle" color="negative" />
            <span>
              We can&apos;t load your website deploy information, please make
              sure a Netlify account is connected to the app settings.
            </span>
          </ErrorText>
        )}
        {!buildHookUrl && (
          <ErrorText>
            <Icon icon="ErrorCircle" color="negative" />
            <span>
              We couldn&apos;t find your build url. Please, make sure you have
              selected and saved your website on the app settings and your
              website has a Build Hook named <b>Contentful</b> on Netlify.
            </span>
          </ErrorText>
        )}
        {lastBuildDate && (
          <Text>Last build triggered on {formatDate(lastBuildDate)}.</Text>
        )}
        {hasBuildBeenFailed && (
          <ErrorText>
            <Icon icon="ErrorCircle" color="negative" />{' '}
            <span>Build failed. Netlify reason: {failedBuildReason}.</span>
          </ErrorText>
        )}
        {hasWebsiteBeenBuilt && (
          <SuccessText>
            <Icon icon="CheckCircle" color="positive" />{' '}
            <span>Success! Your website has finished building.</span>
          </SuccessText>
        )}
      </BuildButtonContainer>

      {siteUrl && (
        <Button
          href={siteUrl}
          target="_blank"
          icon="ExternalLink"
          isFullWidth={true}
          buttonType="muted"
        >
          Open website
        </Button>
      )}
    </div>
  );
};

export default Sidebar;
