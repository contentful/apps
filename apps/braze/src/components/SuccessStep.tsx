import { Paragraph, Button, Subheading } from '@contentful/f36-components';
import { Entry } from '../fields/Entry';
import WizardFooter from './WizardFooter';

type SuccessStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  onClose: () => void;
};

const SuccessStep = ({ onClose }: SuccessStepProps) => {
  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        Success!
      </Subheading>
      <Paragraph>
        Seven fields were successfully sent to Braze. You can view them from your Braze dashboard by
        navigating to Templates {'>'} Content Blocks.
      </Paragraph>
      <WizardFooter paddingTop="0" paddingBottom="0" paddingRight="0">
        <Button variant="primary" size="small" onClick={onClose}>
          Done
        </Button>
      </WizardFooter>
    </>
  );
};

export default SuccessStep;
