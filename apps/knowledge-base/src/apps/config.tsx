import * as React from 'react';
import Layout from '~/templates/layout';
import WelcomeScreen from '~/components/welcome-screen';
import { useSdk } from '~/providers/sdk-provider';
import { useNetlify } from '~/providers/netlify-provider';
import {
  resetCounters,
  replaceLocale,
  getContentTypeSchemaById,
} from '~/utils/utils';
import ConfigHeader from '~/components/config-header';
import ConfigNetlify from '~/components/config-netlify';
import ConfigDeploy from '~/components/config-deploy';
import ConfigSiteSettings from '~/components/config-site-settings';
import ConfigInstallation from '~/components/config-installation';

const { useEffect, useState, useMemo } = React;

interface ConfigProps {
  template: Record<string, any>;
}

const Config: React.FC<ConfigProps> = (props) => {
  const netlify = useNetlify();
  const sdk = useSdk();
  const defaultLocale = sdk.instance.locales.default;
  const template = useMemo(
    () => resetCounters(replaceLocale(props.template, defaultLocale)),
    [props.template, defaultLocale]
  );
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [netlifySelectedSiteUrl, setNetlifySelectedSiteUrl] = useState('');
  const [netlifySelectedSiteId, setNetlifySelectedSiteId] = useState('');
  const [
    netlifySelectedSiteBuildHookUrl,
    setNetlifySelectedSiteBuildHookUrl,
  ] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    sdk.instance.app.isInstalled().then(setIsAppInstalled);
    sdk.instance.app.onConfigure(onSaveOrInstall);
    sdk.instance.app.onConfigurationCompleted(onFinishSavingOrInstalling);
  });

  useEffect(() => {
    sdk.instance.app.setReady();
    loadInitialParams();
  }, []);

  async function loadInitialParams() {
    const params: Record<string, any> = await sdk.instance.app.getParameters();

    setNetlifySelectedSiteUrl(params?.netlifySelectedSiteUrl);
    setNetlifySelectedSiteId(params?.netlifySelectedSiteId);
    setNetlifySelectedSiteBuildHookUrl(params?.netlifySelectedSiteBuildHookUrl);
  }

  async function onFinishSavingOrInstalling() {
    setIsAppInstalled(true);
  }

  async function createContentTypes(contentTypes) {
    const allExistingContentTypes = await sdk.getContentTypes();
    const createdTypes = contentTypes.map(async (contentType) => {
      const existingContentType: Record<
        string,
        any
      > = allExistingContentTypes?.items?.find(
        (item) => contentType.sys.id === item.sys.id
      );

      if (!existingContentType) {
        // If not exist, create
        const newContentType = await sdk.createContentType(
          getContentTypeSchemaById(contentType.sys.id, contentTypes)
        );

        // Update to "Published"
        await sdk.updateContentType(newContentType);
      }

      // Content type exists but it's a "Draft"
      if (existingContentType?.sys?.publishedCounter === 0) {
        // Update to "Published"
        await sdk.updateContentType(existingContentType);
      }
    });

    return Promise.all(createdTypes);
  }

  async function createEntries(entries) {
    const allExistingEntries = await sdk.getEntries({
      limit: 1000,
    });
    const createdEntries = entries.map(async (entry) => {
      const existingEntry: Record<
        string,
        any
      > = allExistingEntries?.items?.find(
        (item) => item.sys.id === entry.sys.id
      );

      if (!existingEntry) {
        // Create if not exist...
        const newEntry = await sdk.createEntry(
          entry.sys.contentType.sys.id,
          entry
        );

        await sdk.publishEntry(newEntry);
      }

      // Entry exists but it's a "Draft"
      if (existingEntry?.sys?.publishedCounter === 0) {
        // Update to "Published"
        await sdk.publishEntry(existingEntry);
      }
    });

    return Promise.all(createdEntries);
  }

  async function createAssets(assets) {
    const allExistingAssets = await sdk.getAssets({ limit: 1000 });
    const createdAssets = assets
      .map((asset) => sdk.prepareAsset(asset, defaultLocale))
      .map(async (asset) => {
        const existingAsset: Record<
          string,
          any
        > = allExistingAssets?.items?.find(
          (item) => item.sys.id === asset.sys.id
        );

        if (!existingAsset) {
          await sdk.createAsset(asset);
          await sdk.processAsset(asset, defaultLocale);
          const processedAsset = await sdk.waitUntilAssetProcessed(
            asset.sys.id,
            defaultLocale
          );
          await sdk.publishAsset(processedAsset);
        }

        // exists but it's a "Draft"
        if (existingAsset?.sys?.publishedCounter === 0) {
          // Update to "Published"
          await sdk.publishAsset(existingAsset);
        }
      });

    return Promise.all(createdAssets);
  }

  async function onSaveOrInstall() {
    const isInstalled = await sdk.instance.app.isInstalled();
    const params: Record<string, any> = await sdk.instance.app.getParameters();

    if (!isInstalled && termsAccepted === false) {
      sdk.instance.notifier.error(
        'You need to accept the terms of the Early Access Program.'
      );
      return false;
    }

    try {
      if (!isInstalled) {
        await createContentTypes(template.contentTypes);
        await createAssets(template.assets);
        await createEntries(template.entries);
      }
    } catch (err) {
      sdk.instance.notifier.error(
        'There was an issue when trying to install the content types. Please, try to re-install the app.'
      );
    }

    if (netlify.isLoadingBuildHooks) {
      sdk.instance.notifier.error(
        'We could not save your website config. Please, try again or wait until we finish loading the config.'
      );
      return false;
    }

    if (isInstalled && !netlifySelectedSiteBuildHookUrl) {
      sdk.instance.notifier.error(
        'We could not save your website config. Please, select a website with a valid "Contentful" build hook set up.'
      );
      return false;
    }

    return {
      parameters: {
        ...params,
        netlifyToken: netlify.accessToken,
        netlifySelectedSiteUrl,
        netlifySelectedSiteId,
        netlifySelectedSiteBuildHookUrl,
      },
      targetState: {
        EditorInterface: {
          kbAppArticle: { sidebar: { position: 1 } },
          kbAppSiteSettings: { sidebar: { position: 1 } },
          kbAppCategory: { sidebar: { position: 1 } },
          kbAppLink: { sidebar: { position: 1 } },
        },
      },
    };
  }

  async function handleOnChangeNetlifySite(
    event: React.ChangeEvent<HTMLSelectElement>
  ): Promise<void> {
    const siteId = event.target.value;
    setNetlifySelectedSiteId(siteId);

    const site = netlify.sites.find((site) => site.site_id === siteId);
    setNetlifySelectedSiteUrl(site.ssl_url);

    try {
      const buildHooks = await netlify.getBuildHooksBySiteId(site.site_id);
      const contentfulHook = buildHooks.find((hook) =>
        hook.title.toLowerCase().startsWith('contentful')
      );

      if (!contentfulHook) throw new Error('Contentful hook does not exist.');

      setNetlifySelectedSiteBuildHookUrl(contentfulHook.url);
      sdk.instance.notifier.success(
        'Website config has been loaded. You can save the app now.'
      );
    } catch (err) {
      setNetlifySelectedSiteBuildHookUrl('');
      sdk.instance.notifier.error(
        `We could not find any "Contentful" build hook for ${site.name}`
      );
    }
  }

  if (!isAppInstalled) {
    return (
      <WelcomeScreen
        termsAccepted={termsAccepted}
        setTermsAccepted={setTermsAccepted}
      />
    );
  }

  return (
    <Layout>
      <ConfigHeader />

      <ConfigInstallation />

      <ConfigNetlify />

      <ConfigDeploy />

      <ConfigSiteSettings
        netlifySelectedSiteId={netlifySelectedSiteId}
        onChangeNetlifySite={handleOnChangeNetlifySite}
      />
    </Layout>
  );
};

export default Config;
