import { Flex } from '@contentful/f36-components';

type WizardFooterProps = {
  children: React.ReactNode;
  marginTop?: string;
  marginBottom?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
};

const WizardFooter = (props: WizardFooterProps) => {
  const {
    children,
    marginTop,
    marginBottom,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  } = props;
  return (
    <Flex
      padding="spacingM"
      gap="spacingM"
      justifyContent="end"
      style={{
        position: 'sticky',
        bottom: 0,
        background: 'white',
        marginTop: marginTop || 'spacingXs',
        marginBottom: marginBottom || 'spacingXs',
        paddingTop: paddingTop || 'spacingM',
        paddingBottom: paddingBottom || 'spacingM',
        paddingLeft: paddingLeft || 'spacingM',
        paddingRight: paddingRight || 'spacingM',
      }}>
      {children}
    </Flex>
  );
};

export default WizardFooter;
