import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@contentful/f36-components';
import { setup } from '@contentful/dam-app-base';
import './index.css';
import logo from './logo.svg';
import { getRenditions, pick, transformAssets } from './utils';

const ADOBE_EXPERIENCE_CLOUD_DOMAIN = `https://experience.adobe.com`;
const SCRIPT_URL = `${ADOBE_EXPERIENCE_CLOUD_DOMAIN}/solutions/CQ-assets-selectors/static-assets/resources/assets-selectors.js`;
// Required scope for the Assets Selectors Content Advisor auth service. This is
// dictated by Adobe (see adobe/aem-assets-selectors-mfe-examples), not by the
// customer's Adobe org, so it is not exposed as an app config field. If Adobe
// ever changes this requirement, auth will start failing with an errorType of
// 'invalid_scope' surfaced via the banner in renderDialog's onErrorReceived.
const IMS_SCOPE = 'AdobeID,openid,additional_info.projectedProductContext,read_organizations';
const FIELDS_TO_PERSIST = [
  'id',
  'name',
  'url',
  'metadata',
  // 'mimetype',
  // 'width',
  // 'height',
  // 'state',
  // 'isExpired',
  // 'thumbnails',
  // 'url',
  // 'renditions',
];

export function makeThumbnail(asset) {
  const thumbRendition = asset?.computedMetadata?._links[ASSET_RENDITIONS_KEY][1];
  const thumbnail = thumbRendition?.href || '';
  const url = typeof thumbnail === 'string' ? thumbnail : undefined;
  const alt = asset.name || asset.id || '';

  return [url, alt];
}

async function openDialog(sdk, _currentValue, _config) {
  const parameters = { ..._config, ...sdk.parameters.instance };
  const assetIds = _currentValue.map((asset) => ({ id: asset.id }));
  parameters.selectedAssets = assetIds;

  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters,
    width: 'fullWidth',
    minHeight: '80vh',
    allowHeightOverflow: true,
  });

  if (!Array.isArray(result)) {
    return [];
  }

  return result.map((asset) => pick(asset, FIELDS_TO_PERSIST));
}

function prepareAEMAssetsHTML() {
  return `
    <dialog id='content-advisor-dialog'>
      <div class='content-advisor-toolbar'>
        <div id='content-advisor-logout-container'></div>
        <div id='content-advisor-error' role='alert' hidden></div>
      </div>
      <div id='content-advisor' style='width:100%;height:95%;'></div>
    </dialog>
  `;
}

function LogoutButton({ onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <Button
      variant="secondary"
      size="small"
      isDisabled={isLoggingOut}
      isLoading={isLoggingOut}
      onClick={async () => {
        setIsLoggingOut(true);
        try {
          await onLogout();
        } finally {
          setIsLoggingOut(false);
        }
      }}>
      Log out
    </Button>
  );
}

function showAuthError(message) {
  const banner = document.getElementById('content-advisor-error');
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

function hideAuthError() {
  const banner = document.getElementById('content-advisor-error');
  if (!banner) return;
  banner.hidden = true;
}

// ============================================================================
// EXPERIMENTAL: popup auth-redirect fix. Flip this to `false` (or delete the
// block below, down to the matching END marker) to fully revert to the
// original behavior if this doesn't fix the auth flow.
//
// Why this exists: with `modalMode: true`, Adobe's IMS login opens a popup
// and, once sign-in completes, navigates that popup to `redirectUrl` (this
// app's own URL). Per Adobe's own docs/examples, `registerContentAdvisorAuthService`
// must also be called on that redirect page. In this app, registration only
// ever happens inside renderDialog(sdk), which itself only runs after
// @contentful/app-sdk's init() completes a handshake with a Contentful parent
// iframe. The popup is a plain top-level window with no such parent, so
// init() never resolves there and the auth service never re-registers -
// which is the likely cause of the popup dying a couple seconds after login.
//
// This block re-registers the auth service unconditionally, but only when
// the page is NOT embedded in an iframe (i.e. this is that popup), using
// IMS config persisted to localStorage by the real, Contentful-embedded
// dialog session (see persistImsConfig() call in renderDialog below).
const ENABLE_POPUP_AUTH_REDIRECT_FIX = true;
const IMS_CONFIG_STORAGE_KEY = 'aem-assets-app:ims-auth-config';

function persistImsConfig({ imsClientId, imsOrg }) {
  try {
    window.localStorage.setItem(IMS_CONFIG_STORAGE_KEY, JSON.stringify({ imsClientId, imsOrg }));
  } catch (e) {
    // localStorage unavailable (private mode, disabled storage, etc). The
    // popup redirect fix just won't have config to work with in that case -
    // same as if this whole block were disabled.
  }
}

function readPersistedImsConfig() {
  try {
    const raw = window.localStorage.getItem(IMS_CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function isEmbeddedInIframe() {
  try {
    return window.top !== window.self;
  } catch (e) {
    // Cross-origin access to window.top throws when embedded cross-origin,
    // which still means "embedded" - so treat the throw as embedded=true.
    return true;
  }
}

function registerImsAuthServiceForPopupRedirect() {
  const persisted = readPersistedImsConfig();
  if (!persisted?.imsClientId) return;

  const script = document.createElement('script');
  script.src = SCRIPT_URL;
  script.async = true;
  script.addEventListener('load', () => {
    PureJSSelectors.registerContentAdvisorAuthService(
      {
        imsClientId: persisted.imsClientId,
        imsOrg: persisted.imsOrg,
        imsScope: IMS_SCOPE,
        redirectUrl: window.location.href,
        modalMode: true,
      },
      false
    );
  });
  document.body.appendChild(script);
}

if (ENABLE_POPUP_AUTH_REDIRECT_FIX && !isEmbeddedInIframe()) {
  registerImsAuthServiceForPopupRedirect();
}
// ============================================================================
// END EXPERIMENTAL popup auth-redirect fix
// ============================================================================

async function renderDialog(sdk) {
  const config = sdk.parameters.invocation;
  const {
    imsClientId,
    imsOrg,
    repositoryId,
    aemTierType,
    env,
    hideUploadButton,
    assetsUrlRoot,
    prefillSelectedAssets,
    selectedAssets,
    hideTreeNav,
    selectionType,
  } = config;

  if (ENABLE_POPUP_AUTH_REDIRECT_FIX) {
    persistImsConfig({ imsClientId, imsOrg });
  }

  const script = document.createElement('script');
  script.src = SCRIPT_URL;
  script.async = true;
  document.body.appendChild(script);

  const container = document.createElement('div');
  container.innerHTML = prepareAEMAssetsHTML();
  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  let imsInstance = null;

  const logoutContainer = document.getElementById('content-advisor-logout-container');
  if (logoutContainer) {
    createRoot(logoutContainer).render(
      <LogoutButton
        onLogout={async () => {
          if (!imsInstance) return;
          try {
            await imsInstance.signOut().then(() => {
              showAuthError(
                'You have been logged out of Adobe. Close this dialog and reopen the asset selector to sign in again.'
              );
            });
          } catch (error) {
            showAuthError(`Failed to log out of Adobe: ${error?.message || error}`);
          }
        }}
      />
    );
  }

  const imsAuthProps = {
    imsClientId: imsClientId,
    imsOrg: imsOrg,
    imsScope: IMS_SCOPE,
    redirectUrl: window.location.href,
    modalMode: true,
    onErrorReceived: (errorType, errorMessage) => {
      showAuthError(
        `Adobe authentication failed (${errorType}). Check that the IMS Client ID and IMS Organization ID in the app configuration are still valid. If this persists after re-checking configuration, the Adobe Assets Selector's required auth scope may have changed and the app needs to be updated. Details: ${errorMessage}`
      );
    },
    onAccessTokenExpired: () => {
      showAuthError(
        'Your Adobe session has expired. Close this dialog and try selecting assets again.'
      );
    },
    onAccessTokenReceived: (imsToken) => {
      if (imsToken) {
        hideAuthError();
      } else {
        // Close the modal if we don't have a valid IMS token. The IMS login modal should open.
        // After signing in, the user can re-open the asset selector by clicking the select assets button.
        sdk.close();
      }
    },
  };

  const contentAdvisorProps = {
    imsOrg,
    hideTreeNav,
    selectedAssets:
      prefillSelectedAssets === 'Yes' && selectedAssets && Array.isArray(selectedAssets)
        ? selectedAssets
        : [],
    selectionType,
    uploadConfig: {
      hideUploadButton: hideUploadButton === 'Yes' ? true : false,
    },
    // handleAssetSelection, // only enabled for testing
    handleSelection,
    onClose,
    expiryOptions: () => {},
    showToast: () => {},
  };

  if (repositoryId) contentAdvisorProps.repositoryId = repositoryId;
  if (!repositoryId && aemTierType && aemTierType !== 'both')
    contentAdvisorProps.aemTierType = [aemTierType];
  if (!repositoryId && env === 'stage') contentAdvisorProps.env = 'stage';

  // this function is only used for testing
  // function handleAssetSelection(assets) {
  //   const transformedAssets = transformAssets(assets);
  // }

  function handleSelection(assets) {
    const transformedAssets = transformAssets(assets, config);
    sdk.close(transformedAssets);
  }

  function onClose() {
    hideAuthError();
    document.getElementById('content-advisor-dialog').close();
    sdk.close();
  }

  function registerImsAuthService() {
    const registeredTokenService = PureJSSelectors.registerContentAdvisorAuthService(
      imsAuthProps,
      false
    );
    imsInstance = registeredTokenService;
  }

  async function renderContentAdvisor() {
    const container = document.getElementById('content-advisor');
    PureJSSelectors.renderContentAdvisorWithAuthFlow(container, contentAdvisorProps, () => {
      document.getElementById('content-advisor-dialog').showModal();
    });
  }

  script.addEventListener('load', () => {
    registerImsAuthService();
    renderContentAdvisor();
  });
}

async function customUpdateStateValue({ currentValue, result, config }, updateStateValue) {
  if (config.prefillSelectedAssets === 'Yes') {
    if (result) await updateStateValue(result);
  } else {
    if (Array.isArray(result) && result.length > 0) {
      const newValue = [...(currentValue || []), ...result];

      await updateStateValue(newValue);
    }
  }
}

function isDisabled() {
  return false;
}

function validateParameters({ imsClientId, imsOrg }) {
  if (!imsClientId) {
    return 'Please add your IMS Client ID';
  }
  if (!imsOrg) {
    return 'Please add your IMS Organization';
  }
  return null;
}

setup({
  cta: 'Select assets from AEM',
  name: 'Adobe Experience Manager Asset Selector',
  logo: logo,
  color: '#ED2224',
  description:
    'The AEM Assets Selector uses the AEM Content Advisor Micro-Frontend allowing editors to select media from their AEM Assets account.',
  parameterDefinitions: [
    {
      id: 'imsClientId',
      type: 'Symbol',
      name: 'IMS Client ID',
      description:
        'The Adobe Identity Management System (IMS) Client ID provided by Adobe for your Adobe AEM CS organization.',
      required: true,
    },
    {
      id: 'imsOrg',
      name: 'IMS Organization',
      type: 'Symbol',
      description:
        'The Adobe Identity Management System (IMS) ID provided by Adobe when provisioning Adobe AEM CS for your organization.',
      required: true,
    },
    {
      id: 'repositoryId',
      name: 'Repository',
      type: 'Symbol',
      description: `Restricts the asset selector to a single repository.
        [The AEM Tier and Environment values are ignored if a Repository value is provided.]`,
    },
    {
      id: 'aemTierType',
      name: 'AEM Tier',
      type: 'List',
      value: 'delivery,author,both',
      default: 'both',
      description: `Restricts the asset selector to repositories in the selected tier(s).
        [Only used if a Repository value is not provided.]`,
    },
    {
      id: 'env',
      name: 'Environment',
      type: 'List',
      value: 'prod,stage',
      default: 'prod',
      description: `Restricts the asset selector to repositories in the selected environment.
        [Only used if a Repository value is not provided.]`,
    },
    {
      id: 'assetsUrlRoot',
      name: 'Assets URL Root',
      type: 'Symbol',
      description: `Specifies the root domain and path for constructing assets' URLs.
        [Used for generating tier or environment specific URLs]`,
    },
    {
      id: 'prefillSelectedAssets',
      name: 'Prefill Selected Assets',
      type: 'List',
      value: 'No,Yes',
      default: 'Yes',
      description: 'Specifies if selected assets are pre-selected in the asset picker.',
    },
    {
      id: 'hideUploadButton',
      name: 'Hide Asset Upload Button',
      type: 'List',
      value: 'Yes, No',
      default: 'Yes',
      description: 'Specifies if the upload button is displayed in the asset picker.',
    },
  ],
  customUpdateStateValue,
  isDisabled,
  makeThumbnail,
  openDialog,
  renderDialog,
  validateParameters,
});
