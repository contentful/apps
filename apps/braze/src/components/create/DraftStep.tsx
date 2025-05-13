import { Paragraph, Button, Subheading } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';
import { ContentBlockState } from './CreateFlow';

type DraftStepProps = {
  isSubmitting: boolean;
  contentBlockStates: Record<string, ContentBlockState>;
  handlePreviousStep: () => void;
  handleNextStep: (data: Record<string, ContentBlockState>) => void;
};

const DraftStep = ({
  isSubmitting,
  contentBlockStates,
  handlePreviousStep,
  handleNextStep,
}: DraftStepProps) => {
  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        This entry is in a "Draft" state.
      </Subheading>
      <Paragraph marginBottom="spacing2Xs">
        This entry has not yet been published, and it's content may not have passed your
        organizations review standards yet. Are you sure you want to send to Braze?
      </Paragraph>
      <WizardFooter>
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button variant="primary" size="small" onClick={() => handleNextStep(contentBlockStates)}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default DraftStep;
