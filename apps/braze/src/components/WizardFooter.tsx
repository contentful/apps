import { Flex } from '@contentful/f36-components';

const FieldsSelectionStep = (props: { children: React.ReactNode }) => {
  const { children } = props;
  return (
    <Flex
      padding="spacingM"
      gap="spacingM"
      justifyContent="end"
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'white',
      }}>
      {children}
    </Flex>
  );
};
export default FieldsSelectionStep;
