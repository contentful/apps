import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';
import useKeyService from 'hooks/useKeyService';

const hardCodedPropertyId = 'properties/354125506';
const hardCodedSlug = 'pretendSlug';

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
