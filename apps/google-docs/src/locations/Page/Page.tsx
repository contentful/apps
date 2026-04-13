import { useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button, Layout } from '@contentful/f36-components';
import {
  ModalOrchestrator,
  ModalOrchestratorHandle,
} from './components/mainpage/ModalOrchestrator';
import { MainPageView } from './components/mainpage/MainPageView';
import { MappingReviewPage } from './components/mainpage/MappingReviewPage';
import { loadFixtureReviewPayload } from '../../fixtures/googleDocsReview/loadFixtureReviewPayload';
import type { MappingReviewSuspendPayload, PreviewPayload } from '@types';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const modalOrchestratorRef = useRef<ModalOrchestratorHandle>(null);
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(true);
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);
  const [mappingReviewPayload, setMappingReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);
  const [fixtureReviewPayload, setFixtureReviewPayload] =
    useState<MappingReviewSuspendPayload | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void loadFixtureReviewPayload()
      .then((payload) => {
        if (!isCancelled) {
          setFixtureReviewPayload(payload);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setFixtureReviewPayload(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOauthTokenChange = (token: string) => {
    setOauthToken(token);
  };

  const handleOAuthConnectedChange = (isConnected: boolean) => {
    setIsOAuthConnected(isConnected);
  };

  const handleOAuthLoadingStateChange = (isLoading: boolean) => {
    setIsOAuthLoading(isLoading);
  };

  const handleSelectFile = () => {
    modalOrchestratorRef.current?.startFlow();
  };

  const handlePreviewReady = (payload: PreviewPayload) => {
    setPreviewPayload(payload);
  };

  const handleMappingReviewReady = (payload: MappingReviewSuspendPayload) => {
    setMappingReviewPayload(payload);
  };

  const handleReturnToMainPage = () => {
    setPreviewPayload(null);
    setMappingReviewPayload(null);
  };

  const handleResumeMappingReview = async () => {
    if (!mappingReviewPayload) {
      return;
    }

    await modalOrchestratorRef.current?.resumeMappingReview(mappingReviewPayload);
  };

  const activePreviewPayload = mappingReviewPayload;

  return (
    <>
      <Layout withBoxShadow={true} offsetTop={10}>
        {activePreviewPayload ? (
          <MappingReviewPage
            payload={activePreviewPayload}
            oauthToken={oauthToken}
            onLeaveReview={handleReturnToMainPage}
            onResumeMappingReview={handleResumeMappingReview}
          />
        ) : (
          <>
            {fixtureReviewPayload ? (
              <Button onClick={() => setMappingReviewPayload(fixtureReviewPayload)}>
                Mock from fixture
              </Button>
            ) : null}
            <MainPageView
              oauthToken={oauthToken}
              isOAuthConnected={isOAuthConnected}
              isOAuthLoading={isOAuthLoading}
              onOAuthConnectedChange={handleOAuthConnectedChange}
              onOauthTokenChange={handleOauthTokenChange}
              onLoadingStateChange={handleOAuthLoadingStateChange}
              onSelectFile={handleSelectFile}
              sdk={sdk}
            />
          </>
        )}
      </Layout>

      <ModalOrchestrator
        ref={modalOrchestratorRef}
        sdk={sdk}
        oauthToken={oauthToken}
        onPreviewReady={handlePreviewReady}
        onMappingReviewReady={handleMappingReviewReady}
        onResetToMain={handleReturnToMainPage}
      />
    </>
  );
};

export default Page;
