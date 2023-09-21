import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import Note from '@components/common/Note/Note';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

interface ParametersMissingProps {
  message: string;
  linkSubstring?: string;
}

const warningLinkStyles = css({
  color: `${tokens.gray700} !important`,
  fontWeight: `${tokens.fontWeightNormal} !important`,
  textDecoration: 'underline',
});

const ParametersMissingWarning = (props: ParametersMissingProps) => {
  const { message, linkSubstring } = props;

  const sdk = useSDK<SidebarAppSDK>();
  const openConfigPage = () => sdk.navigator.openAppConfig();

  return (
    <Note
      body={
        linkSubstring ? (
          <HyperLink
            body={message}
            substring={linkSubstring}
            onClick={openConfigPage}
            textLinkStyle={warningLinkStyles}
          />
        ) : (
          message
        )
      }
      variant="warning"
    />
  );
};

export default ParametersMissingWarning;
