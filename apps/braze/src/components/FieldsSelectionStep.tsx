import { Button, Flex, Paragraph, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

type FieldsSelectionStepProps = {
  handleNextStep: () => void;
};
const FieldsSelectionStep = (props: FieldsSelectionStepProps) => {
  const { handleNextStep } = props;
  return (
    <>
      <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
        Select which fields you would like to include in your Connected Content call. Selecting
        fields from referenced entries is limited to 5 nested references. For more information on
        Braze Connected Content {''}
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href="https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content"
          target="_blank"
          rel="noopener noreferrer">
          view documentation here
        </TextLink>
      </Paragraph>

      <Flex
        padding="spacingM"
        gap="spacingM"
        justifyContent="end"
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'white',
        }}>
        <Button variant="primary" size="small" onClick={handleNextStep}>
          Next
        </Button>
      </Flex>
    </>
  );
};
export default FieldsSelectionStep;
