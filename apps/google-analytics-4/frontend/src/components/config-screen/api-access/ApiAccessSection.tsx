import DisplayServiceAccountCard from 'components/config-screen/api-access/display/DisplayServiceAccountCard';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { Subheading, Paragraph, Stack } from '@contentful/f36-components';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';

interface Props {
  onAccountSummariesChange: Function;
  isAppInstalled: boolean;
  parameters: KeyValueMap;
  mergeSdkParameters: Function;
  isInEditMode: boolean;
  isSavingPrivateKeyFile: boolean;
  onInEditModeChange: Function;
  onHasServiceCheckErrorsChange: Function;
  onKeyFileUpdate: Function;
  onIsApiAccessLoading: Function;
}

const ApiAccessSection = (props: Props) => {
  const {
    onAccountSummariesChange,
    isAppInstalled,
    parameters,
    mergeSdkParameters,
    isInEditMode,
    isSavingPrivateKeyFile,
    onInEditModeChange,
    onHasServiceCheckErrorsChange,
    onKeyFileUpdate,
    onIsApiAccessLoading,
  } = props;

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <div>
        <Subheading marginBottom="spacingXs">API access</Subheading>
        <Paragraph marginBottom="none">
          Authorize this application to access Google Analytics 4 Admin and Data APIs
        </Paragraph>
      </div>
      {!isInEditMode && isAppInstalled && parameters && parameters.serviceAccountKeyId ? (
        <DisplayServiceAccountCard
          isSavingPrivateKeyFile={isSavingPrivateKeyFile}
          onInEditModeChange={onInEditModeChange}
          serviceAccountKeyId={parameters.serviceAccountKeyId}
          onAccountSummariesChange={onAccountSummariesChange}
          isAppInstalled={isAppInstalled}
          parameters={parameters}
          onHasServiceCheckErrorsChange={onHasServiceCheckErrorsChange}
          onIsApiAccessLoading={onIsApiAccessLoading}
        />
      ) : (
        <SetupServiceAccountCard
          parameters={parameters}
          mergeSdkParameters={mergeSdkParameters}
          isInEditMode={isInEditMode}
          onInEditModeChange={onInEditModeChange}
          onKeyFileUpdate={onKeyFileUpdate}
        />
      )}
    </Stack>
  );
};

export default ApiAccessSection;
