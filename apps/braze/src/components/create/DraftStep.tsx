import { Paragraph, Button, Subheading } from '@contentful/f36-components';
import WizardFooter from '../WizardFooter';
import { ContentBlockData } from './CreateFlow';
import CreateButton from './CreateButton';

type DraftStepProps = {
  isSubmitting: boolean;
  contentBlocksData: ContentBlockData;
  handlePreviousStep: () => void;
  handleNextStep: (data: ContentBlockData) => void;
};

const DraftStep = ({
  isSubmitting,
  contentBlocksData,
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
        <CreateButton isLoading={isSubmitting} onClick={() => handleNextStep(contentBlocksData)} />
      </WizardFooter>
    </>
  );
};

export default DraftStep;
