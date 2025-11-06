import { Flex, Subheading, Paragraph } from '@contentful/f36-components';

export default function Disclaimer() {
  return (
    <Flex flexDirection="column" gap="spacingL" paddingTop="spacingM" paddingBottom="spacingM">
      {/* Section header */}
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Disclaimer</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
      </Flex>
    </Flex>
  );
}
