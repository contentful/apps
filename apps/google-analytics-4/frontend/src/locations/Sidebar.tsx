import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useApi } from 'hooks/useApi';

const Sidebar = () => {
  const sdk = useSDK<any>();

  const { serviceAccountKey, serviceAccountKeyId, savedPropertyId, contentTypes } =
    sdk.parameters.installation;

  const currentContentType = sdk.contentType.sys.id;

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  return (
    <>
      <AnalyticsApp
        api={api}
        propertyId={savedPropertyId}
        reportSlug={contentTypes[currentContentType].urlPrefix}
      />
    </>
  );
};

export default Sidebar;
