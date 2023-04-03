import HyperLink from 'components/common/HyperLink/HyperLink';
import { Paragraph, Subheading } from '@contentful/f36-components';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';

export const NO_CONTENT_TYPES_MSG =
  'Be sure to save this configuration. Once you have configured a content type, head over to the Content tab, open an entry associated with a configured content type, and view the app in the sidebar.';
export const CONTENT_TYPES_MSG =
  'Be sure to save this configuration. Head over to the Content tab, open an entry associated with a configured content type, and view the app in the sidebar.';

interface Props {
  isContentTypeConfigured?: boolean;
}

const NextStepsSection = (props: Props) => {
  const { isContentTypeConfigured } = props;
  const sdk = useSDK<AppExtensionSDK>();

  const openEntriesList = () => sdk.navigator.openEntriesList();

  return (
    <>
      <Subheading marginBottom="spacingXs">View app</Subheading>
      <Paragraph>
        <HyperLink
          body={isContentTypeConfigured ? CONTENT_TYPES_MSG : NO_CONTENT_TYPES_MSG}
          substring="Content tab"
          onClick={openEntriesList}
        />
      </Paragraph>
      <Paragraph marginBottom="none">
        <HyperLink
          body="Questions or concerns? Contact support."
          substring="Contact support."
          hyperLinkHref="https://www.contentful.com/support/?utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help"
          icon={<ExternalLinkIcon />}
          alignIcon="end"
        />
      </Paragraph>
    </>
  );
};

export default NextStepsSection;
