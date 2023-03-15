import React, { useState } from 'react';
import DisplayServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { Subheading, Paragraph, Stack } from '@contentful/f36-components';
import useKeyService from 'hooks/useKeyService';

interface Props {
  onAccountSummariesChange: Function;
  isAppInstalled: boolean;
}

const ApiAccessSection = (props: Props) => {
  const { onAccountSummariesChange, isAppInstalled } = props;

  const {
    parameters,
    serviceAccountKeyFile,
    serviceAccountKeyFileErrorMessage,
    serviceAccountKeyFileIsValid,
    serviceAccountKeyFileIsRequired,
    handleKeyFileChange,
  } = useKeyService({ onSaveGoogleAccountDetails: handleSaveGoogleAccountDetails });

  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);

  function handleSaveGoogleAccountDetails() {
    setIsInEditMode(false);
  }

  const handleKeyFileChangeEventWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleKeyFileChange(event.target.value);
  };

  const handleEditGoogleAccountDetails = () => {
    setIsInEditMode(true);
  };

  const handleCancelGoogleAccountDetails = () => {
    handleKeyFileChange('');
    setIsInEditMode(false);
  };

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <div>
        <Subheading marginBottom="none">API Access</Subheading>
        <Paragraph marginBottom="none">
          Authorize this application to access Google Analytics Admin & Data APIs
        </Paragraph>
      </div>
      {!isInEditMode &&
      parameters &&
      parameters.serviceAccountKeyId &&
      parameters.serviceAccountKey ? (
        <DisplayServiceAccountCard
          onEditGoogleAccountDetails={handleEditGoogleAccountDetails}
          serviceAccountKeyId={parameters.serviceAccountKeyId}
          serviceAccountKey={parameters.serviceAccountKey}
          onAccountSummariesChange={onAccountSummariesChange}
          isAppInstalled={isAppInstalled}
        />
      ) : (
        <SetupServiceAccountCard
          isRequired={serviceAccountKeyFileIsRequired}
          isValid={serviceAccountKeyFileIsValid}
          errorMessage={serviceAccountKeyFileErrorMessage}
          serviceAccountKeyFile={serviceAccountKeyFile}
          onKeyFileChange={handleKeyFileChangeEventWrapper}
          isInEditMode={isInEditMode}
          onCancelGoogleAccountDetails={handleCancelGoogleAccountDetails}
        />
      )}
    </Stack>
  );
};

export default ApiAccessSection;
