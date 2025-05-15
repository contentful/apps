import { Stack, Button, Subheading, Text } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';
import { styles } from './ErrorStep.styles';
import { ContentBlockData } from './CreateFlow';
import React from 'react';

type CreationResultField = {
  fieldId: string;
  success: boolean;
  statusCode: number;
  message: string;
};

type ClientErrorStepProps = {
  isSubmitting: boolean;
  creationResultFields: CreationResultField[];
  contentBlocksData: ContentBlockData;
  handleClose: () => void;
  handleCreate: (data: ContentBlockData) => void;
};

const ErrorStep = ({
  isSubmitting,
  creationResultFields,
  contentBlocksData,
  handleClose,
  handleCreate,
}: ClientErrorStepProps) => {
  const clientErrors = creationResultFields.filter(
    (field) => !field.success && field.statusCode !== 500
  );
  const serverErrors = creationResultFields.filter(
    (field) => !field.success && field.statusCode === 500
  );
  const correctlyCreatedFields = creationResultFields.filter((field) => field.success);
  const containsServerError = serverErrors.length > 0;

  function handleRetry() {
    const filteredContentBlocksData = {
      names: Object.fromEntries(
        Object.entries(contentBlocksData.names).filter(
          ([fieldId]) => !correctlyCreatedFields.some((field) => field.fieldId === fieldId)
        )
      ),
      descriptions: Object.fromEntries(
        Object.entries(contentBlocksData.descriptions).filter(
          ([fieldId]) => !correctlyCreatedFields.some((field) => field.fieldId === fieldId)
        )
      ),
    };
    handleCreate(filteredContentBlocksData);
  }

  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        There was an issue
      </Subheading>
      <Stack flexDirection="column" alignItems="flex-start" className={styles.stack}>
        {containsServerError && serverErrors[0] && (
          <Text>
            Error code [{serverErrors[0].statusCode}] - [{serverErrors[0].message}] . Please retry
            sending to Braze.
          </Text>
        )}
        {clientErrors.map((field, index) => (
          <Text key={`${field.fieldId}-${index}`}>
            Error code [{field.statusCode}] - [{field.message}]
          </Text>
        ))}
      </Stack>
      <WizardFooter>
        {containsServerError ? (
          <Button variant="primary" size="small" onClick={handleRetry}>
            {isSubmitting ? 'Retrying...' : 'Retry'}
          </Button>
        ) : (
          <Button variant="primary" size="small" onClick={handleClose}>
            Done
          </Button>
        )}
      </WizardFooter>
    </>
  );
};

export default ErrorStep;
