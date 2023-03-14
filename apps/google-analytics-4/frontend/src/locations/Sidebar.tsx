import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useApi } from 'hooks/useApi';

const hardCodedSlug = '/en-US';

const Sidebar = () => {
  const sdk = useSDK<any>();

  const { serviceAccountKey, serviceAccountKeyId, savedPropertyId } = sdk.parameters.installation;

  const api = useApi(serviceAccountKeyId, serviceAccountKey);

  return (
    <>
      {savedPropertyId && (
        <AnalyticsApp api={api} propertyId={savedPropertyId} reportSlug={hardCodedSlug} />
      )}
    </>
  );
};

export default Sidebar;
