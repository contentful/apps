import { Box, Paragraph, Button } from '@contentful/f36-components';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';

type CreateStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  contentBlockName: string;
  setContentBlockName: (name: string) => void;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
};

const CreateStep = ({ isSubmitting, handlePreviousStep, handleNextStep }: CreateStepProps) => {
  return (
    <>
      <Box>
        <Paragraph>
          Edit each field to change the name or add an optional description. When complete, send
          directly to Braze. Content Block names should be unique.
        </Paragraph>
      </Box>
      <WizardFooter paddingTop="spacing2Xs" paddingBottom="0" paddingRight="0">
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button variant="primary" size="small" onClick={handleNextStep}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default CreateStep;
