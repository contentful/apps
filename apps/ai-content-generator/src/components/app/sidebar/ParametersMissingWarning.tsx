import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import Note from '@components/common/Note/Note';
import HyperLink from '@components/common/HyperLink/HyperLink';

interface ParametersMissingProps {
  message: string;
  linkSubstring: string;
}

const ParametersMissingWarning = (props: ParametersMissingProps) => {
  const { message, linkSubstring } = props;

  const sdk = useSDK<SidebarAppSDK>();
  const openConfigPage = () => sdk.navigator.openAppConfig();

  return (
    <Note
      body={<HyperLink body={message} substring={linkSubstring} onClick={openConfigPage} />}
      variant="warning"
    />
  );
};

export default ParametersMissingWarning;
