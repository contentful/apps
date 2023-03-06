import AnalyticsApp from 'components/main-app/analytics-app/AnalyticsApp';

const hardCodedId = {};

const hardCodedKey = {};

// all of this info is a prop here.....
const Sidebar = () => {
  return (
    <AnalyticsApp
      serviceAccountKeyId={hardCodedId}
      serviceAccountKey={hardCodedKey}
      propertyId="354125506"
    />
  );
};

export default Sidebar;
