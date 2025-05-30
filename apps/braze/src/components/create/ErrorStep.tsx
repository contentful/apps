import { Button, Subheading, Text, List } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';
import { ContentBlockData, CreationResultField } from './CreateFlow';
import InformationWithLink from '../InformationWithLink';
import { localizeFieldId } from '../../utils';

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
  const createdFields = creationResultFields.filter((field) => field.success);
  const customerErrors = creationResultFields.filter(
    (field) => !field.success && field.statusCode === 600
  );
  const serverErrors = creationResultFields.filter(
    (field) => !field.success && field.statusCode === 500
  );
  const clientErrors = creationResultFields.filter(
    (field) => !field.success && field.statusCode !== 500 && field.statusCode !== 600
  );
  const containsServerError = serverErrors.length > 0;

  function handleRetry() {
    const filteredContentBlocksData = {
      names: Object.fromEntries(
        Object.entries(contentBlocksData.names).filter(
          ([fieldId]) => !createdFields.some((field) => field.fieldId === fieldId)
        )
      ),
      descriptions: Object.fromEntries(
        Object.entries(contentBlocksData.descriptions).filter(
          ([fieldId]) => !createdFields.some((field) => field.fieldId === fieldId)
        )
      ),
    };
    handleCreate(filteredContentBlocksData);
  }

  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        There was an issue with some Content Blocks
      </Subheading>
      <Text>The following errors occurred:</Text>
      <List>
        {customerErrors.map((field, index) => (
          <List.Item key={`${field.fieldId}-${index}`}>
            <Text fontWeight="fontWeightDemiBold">
              {localizeFieldId(field.fieldId, field.locale)}
            </Text>{' '}
            - error code {field.statusCode} - {field.message}. Please fix the errors and retry
            sending to Braze.
          </List.Item>
        ))}
        {serverErrors.map((field, index) => (
          <List.Item key={`${field.fieldId}-${index}`}>
            <Text fontWeight="fontWeightDemiBold">
              {localizeFieldId(field.fieldId, field.locale)}
            </Text>{' '}
            - error code {field.statusCode} - {field.message}. Please retry sending to Braze.
          </List.Item>
        ))}
        {clientErrors.map((field, index) => (
          <List.Item key={`${field.fieldId}-${index}`}>
            <Text fontWeight="fontWeightDemiBold">
              {localizeFieldId(field.fieldId, field.locale)}
            </Text>{' '}
            - error code {field.statusCode} - {field.message}
          </List.Item>
        ))}
        {clientErrors.length > 0 && (
          <List.Item>
            <InformationWithLink
              url={'https://support.contentful.com/hc/en-us'}
              linkText="Get support here"
              marginTop="spacing2Xs"
            />
          </List.Item>
        )}
      </List>
      {createdFields.length > 0 && (
        <>
          <br />
          <Text>The following Content Blocks were created successfully:</Text>
          <List>
            {createdFields.map((field, index) => (
              <List.Item key={`${field.fieldId}-${index}`}>
                <Text fontWeight="fontWeightDemiBold">
                  {contentBlocksData.names[localizeFieldId(field.fieldId, field.locale)]}
                </Text>
              </List.Item>
            ))}
          </List>
        </>
      )}
      <WizardFooter>
        {containsServerError ? (
          <Button isLoading={isSubmitting} variant="primary" size="small" onClick={handleRetry}>
            Retry
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
