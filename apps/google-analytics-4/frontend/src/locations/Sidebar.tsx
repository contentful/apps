import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { useApi } from 'hooks/useApi';

const Sidebar = () => {
  const sdk = useSDK<SidebarExtensionSDK>();

  const { serviceAccountKey, serviceAccountKeyId, savedPropertyId, contentTypes } =
    sdk.parameters.installation;

  const currentContentType = sdk.contentType.sys.id;
  const slugFieldInfo = contentTypes[currentContentType];

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  return (
    <>
      <AnalyticsApp api={api} propertyId={savedPropertyId} slugFieldInfo={slugFieldInfo} />
    </>
  );
};

export default Sidebar;
