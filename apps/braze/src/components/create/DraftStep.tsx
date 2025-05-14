import { Paragraph, Button, Subheading } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';

type DraftStepProps = {
  isSubmitting: boolean;
  contentBlockNames: Record<string, string>;
  handlePreviousStep: () => void;
  handleNextStep: (contentBlockNames: Record<string, string>) => void;
};

const DraftStep = ({
  isSubmitting,
  contentBlockNames,
  handlePreviousStep,
  handleNextStep,
}: DraftStepProps) => {
  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        This entry is in a “Draft” state.
      </Subheading>
      <Paragraph marginBottom="spacing2Xs">
        This entry has not yet been published, and it's content may not have passed your
        organizations review standards yet. Are you sure you want to send to Braze?
      </Paragraph>
      <WizardFooter>
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button variant="primary" size="small" onClick={() => handleNextStep(contentBlockNames)}>
          {isSubmitting ? 'Creating...' : 'Send to Braze'}
        </Button>
      </WizardFooter>
    </>
  );
};

export default DraftStep;
