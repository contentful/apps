import { Stack, Button, Subheading, Text } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';
import { styles } from './ClientErrorStep.styles';

type FieldError = {
  fieldId: string;
  success: boolean;
  statusCode: number;
  message: string;
};

type ClientErrorStepProps = {
  fieldsWithErrors: FieldError[];
  handleClose: () => void;
};

const ClientErrorStep = ({ fieldsWithErrors, handleClose }: ClientErrorStepProps) => {
  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        There was an issue
      </Subheading>
      <Stack flexDirection="column" alignItems="flex-start" className={styles.stack}>
        {fieldsWithErrors
          .filter((field) => field.statusCode !== 500)
          .map((field) => (
            <Text key={`${field.fieldId}-index`}>
              Error code [{field.statusCode}] - [{field.message}]
            </Text>
          ))}
      </Stack>
      <WizardFooter>
        <Button variant="primary" size="small" onClick={handleClose}>
          Done
        </Button>
      </WizardFooter>
    </>
  );
};

export default ClientErrorStep;
