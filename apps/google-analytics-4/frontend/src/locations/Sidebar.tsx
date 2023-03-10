import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import { useSDK } from '@contentful/react-apps-toolkit';

// TO DO: Add propertyId and reportSlug logic

const Sidebar = () => {
  const sdk = useSDK<any>();

  const { serviceAccountKey, serviceAccountKeyId } = sdk.parameters;

  return (
    <AnalyticsApp
      serviceAccountKeyId={serviceAccountKeyId}
      serviceAccountKey={serviceAccountKey}
      propertyId=""
      reportSlug=""
    />
  );
};

export default Sidebar;
