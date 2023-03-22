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
  onInEditModeChange: Function;
  onIsValidServiceAccount: Function;
  onHasServiceCheckErrorsChange: Function;
}

const ApiAccessSection = (props: Props) => {
  const {
    onAccountSummariesChange,
    isAppInstalled,
    parameters,
    mergeSdkParameters,
    isInEditMode,
    onInEditModeChange,
    onIsValidServiceAccount,
    onHasServiceCheckErrorsChange,
  } = props;

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <div>
        <Subheading marginBottom="spacingXs">API access</Subheading>
        <Paragraph marginBottom="none">
          Authorize this application to access Google Analytics Admin & Data APIs
        </Paragraph>
      </div>
      {!isInEditMode &&
      isAppInstalled &&
      parameters &&
      parameters.serviceAccountKeyId &&
      parameters.serviceAccountKey ? (
        <DisplayServiceAccountCard
          onInEditModeChange={onInEditModeChange}
          serviceAccountKeyId={parameters.serviceAccountKeyId}
          serviceAccountKey={parameters.serviceAccountKey}
          onAccountSummariesChange={onAccountSummariesChange}
          isAppInstalled={isAppInstalled}
          parameters={parameters}
          onHasServiceCheckErrorsChange={onHasServiceCheckErrorsChange}
        />
      ) : (
        <SetupServiceAccountCard
          parameters={parameters}
          mergeSdkParameters={mergeSdkParameters}
          isInEditMode={isInEditMode}
          onInEditModeChange={onInEditModeChange}
          onIsValidServiceAccount={onIsValidServiceAccount}
        />
      )}
    </Stack>
  );
};

export default ApiAccessSection;
