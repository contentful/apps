import { Flex } from '@contentful/f36-components';

type WizardFooterProps = {
  children: React.ReactNode;
};

const WizardFooter = (props: WizardFooterProps) => {
  const { children } = props;
  return (
    <Flex
      paddingTop="spacingM"
      paddingBottom="spacingXs"
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

export default WizardFooter;
