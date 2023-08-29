import Note from '@components/common/Note/Note';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigErrors } from '@components/config/configText';

const NoContentTypesWarning = () => {
  const sdk = useSDK();
  const space = sdk.ids.space;
  const environment = sdk.ids.environment;

  const link =
    environment === 'master'
      ? `https://app.contentful.com/spaces/${space}/content_types`
      : `https://app.contentful.com/spaces/${space}/environments/${environment}/content_types`;

  return (
    <Note
      body={
        <HyperLink
          body={ConfigErrors.noContentTypes}
          substring={ConfigErrors.noContentTypesSubstring}
          hyperLinkHref={link}
        />
      }
      variant="warning"
    />
  );
};

export default NoContentTypesWarning;
