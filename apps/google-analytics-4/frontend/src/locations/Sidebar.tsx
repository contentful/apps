import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import useKeyService from 'hooks/useKeyService';

// TO DO: Add propertyId and reportSlug logic

const Sidebar = () => {
  const { parameters } = useKeyService({});

  const { serviceAccountKey, serviceAccountKeyId } = parameters;

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
