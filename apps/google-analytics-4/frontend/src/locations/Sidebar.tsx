import AnalyticsApp from 'components/main-app/AnalyticsApp/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { useApi } from 'hooks/useApi';
import { AppInstallationParameters } from 'types';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();

  const { serviceAccountKeyId, propertyId, contentTypes } = sdk.parameters
    .installation as AppInstallationParameters;

  const currentContentType = sdk.contentType.sys.id;
  const slugFieldInfo = (contentTypes && contentTypes[currentContentType]) ?? {
    slugField: '',
    urlPrefix: '',
  };

  const api = useApi(serviceAccountKeyId);

  return (
    <>
      <AnalyticsApp api={api} propertyId={propertyId} slugFieldInfo={slugFieldInfo} />
    </>
  );
};

export default Sidebar;
