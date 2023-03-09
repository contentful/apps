import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import useKeyService from 'hooks/useKeyService';

const hardCodedPropertyId = 'properties/275538046';
const hardCodedSlug = '/en-US';

const Sidebar = () => {
  const { parameters } = useKeyService({});

  const { serviceAccountKey, serviceAccountKeyId } = parameters;

  return (
    <AnalyticsApp
      serviceAccountKeyId={serviceAccountKeyId}
      serviceAccountKey={serviceAccountKey}
      propertyId={hardCodedPropertyId}
      reportSlug={hardCodedSlug}
    />
  );
};

export default Sidebar;
