import { Box, Flex, Spacing } from '@contentful/f36-components';
import { styles } from './Indentation.styles';

type Props = {
  isLast?: boolean;
};
function TComponent() {
  return (
    <Flex flexDirection="column">
      <Box className={styles.tTopStyle}></Box>
      <Box className={styles.tBottomStyle}></Box>
    </Flex>
  );
}

function LComponent() {
  return <Box className={styles.lStyle}></Box>;
}

export const VerticalComponent = () => {
  return <Box className={styles.verticalStyle} />;
};

export const Indentation = ({ isLast }: Props) => {
  if (isLast) {
    return <LComponent />;
  }

  return <TComponent />;
};
