import React, { useState } from 'react';
import InstalledServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { Subheading, Paragraph, Stack } from '@contentful/f36-components';
import useKeyService from 'hooks/useKeyService';

interface Props {
  onAccountSummariesFetch: Function;
}

const ApiAccessPage = (props: Props) => {
  const { onAccountSummariesFetch } = props
  const { parameters, serviceAccountKeyFile, serviceAccountKeyFileErrorMessage, serviceAccountKeyFileIsValid, serviceAccountKeyFileIsRequired, handleKeyFileChange } = useKeyService();

  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);


  const handleKeyFileChangeEventWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleKeyFileChange(event.target.value);
  };

  const handleEditGoogleAccountDetails = () => {
    setIsInEditMode(true);
  }

  const handleCancelGoogleAccountDetails = () => {
    handleKeyFileChange('');
    setIsInEditMode(false);
  }

  const handleSaveGoogleAccountDetails = () => {
    // Save stuff to local storage (mainly json blob) and probably the lambda/db on aws
    setIsInEditMode(false);
  }


  return (
    <Stack spacing='spacingL' flexDirection='column' alignItems='flex-start' >
      <div>
        <Subheading marginBottom='none'>
          API Access
        </Subheading>
        <Paragraph marginBottom='none'>
          Authorize this application to access Google Analytics Admin & Data APIs
        </Paragraph>
      </div>
      {
        !isInEditMode && parameters && parameters.serviceAccountKeyId && parameters.serviceAccountKey ? (
          <InstalledServiceAccountCard
            onEditGoogleAccountDetails={handleEditGoogleAccountDetails}
            serviceAccountKeyId={parameters.serviceAccountKeyId}
            serviceAccountKey={parameters.serviceAccountKey}
            onAccountSummariesFetch={onAccountSummariesFetch}
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
            onSaveGoogleAccountDetails={handleSaveGoogleAccountDetails}
          />
        )
      }
    </Stack>
  )
};

export default ApiAccessPage;
