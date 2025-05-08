import { Paragraph, Button, Subheading } from '@contentful/f36-components';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';

type SuccessStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  handleClose: () => void;
};


const SuccessStep = ({ selectedFields, handleClose }: SuccessStepProps) => {
  return (
    <>
      <Subheading fontWeight="fontWeightDemiBold" fontSize="fontSizeXl" lineHeight="lineHeightL">
        Success!
      </Subheading>
      <Paragraph>
        {selectedFields.size || 0} {selectedFields.size === 1 ? 'field was' : 'fields were'}{' '}
        successfully sent to Braze. You can view them from your Braze dashboard by navigating to
        Templates {'>'} Content Blocks.
      </Paragraph>
      <WizardFooter>
        <Button variant="primary" size="small" onClick={handleClose}>
          Done
        </Button>
      </WizardFooter>
    </>
  );
};

export default SuccessStep;
