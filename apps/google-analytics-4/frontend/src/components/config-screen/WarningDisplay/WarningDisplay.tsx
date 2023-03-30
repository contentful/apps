import { Box, Tooltip } from '@contentful/f36-components';
import { WarningIcon, ErrorCircleIcon } from '@contentful/f36-icons';
import { ConfigurationWarningTypes } from 'types';
import { WarningTypes } from 'components/config-screen/WarningDisplay/constants/warningMessages';

interface Props {
  warningType: ConfigurationWarningTypes;
  tooltipContent: string;
  className?: string;
}

const WarningDisplay = (props: Props) => {
  const { warningType, tooltipContent, className } = props;

  if (warningType === WarningTypes.Warning) {
    return (
      <Box className={className} testId="warningIcon">
        <Tooltip content={tooltipContent}>
          <WarningIcon variant="warning" />
        </Tooltip>
      </Box>
    );
  } else if (warningType === WarningTypes.Error) {
    return (
      <Box className={className} testId="errorIcon">
        <Tooltip content={tooltipContent}>
          <ErrorCircleIcon variant="negative" />
        </Tooltip>
      </Box>
    );
  } else {
    return <Box className={className} testId="noStatus" />;
  }
};

export default WarningDisplay;
