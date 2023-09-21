import { useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import Note from '@components/common/Note/Note';
import HyperLink from '@components/common/HyperLink/HyperLink';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

interface BrandProfileMissingProps {
  message: string;
  linkSubstring: string;
}

const warningLinkStyles = css({
  color: `${tokens.gray700} !important`,
  fontWeight: `${tokens.fontWeightNormal} !important`,
  textDecoration: 'underline',
});

const BrandProfileMissingWarning = (props: BrandProfileMissingProps) => {
  const userHasDismissedWarning = localStorage.getItem('cf_dismiss_brand_profile_warning');
  const [isDismissed, setIsDismissed] = useState<boolean>(Boolean(userHasDismissedWarning));
  const { message, linkSubstring } = props;

  const sdk = useSDK<SidebarAppSDK>();
  const openConfigPage = () => sdk.navigator.openAppConfig();

  const handleClose = () => {
    setIsDismissed(true);
    localStorage.setItem('cf_dismiss_brand_profile_warning', 'true');
  };

  return (
    <>
      {!isDismissed ? (
        <Note
          body={
            <HyperLink
              body={message}
              substring={linkSubstring}
              onClick={openConfigPage}
              textLinkStyle={warningLinkStyles}
            />
          }
          variant="warning"
          withCloseButton={true}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
};

export default BrandProfileMissingWarning;
