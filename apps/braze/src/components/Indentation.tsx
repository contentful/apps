import { Box, Flex } from '@contentful/f36-components';
import { lStyle, tBottomStyle, tTopStyle } from './Indentation.syles';

type Props = {
  isLast?: boolean;
};
function TComponent() {
  return (
    <Flex flexDirection="column">
      <Box style={tTopStyle}></Box>
      <Box style={tBottomStyle}></Box>
    </Flex>
  );
}

function LComponent() {
  return <Box style={lStyle}></Box>;
}

export const Indentation = ({ isLast }: Props) => {
  if (isLast) {
    return <LComponent />;
  }

  return <TComponent />;
};
