import { Box, HelpText } from '@contentful/f36-components';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { copies } from '@constants/copies';
import { AppInstallationParameters, Path } from '@customTypes/configPage';
import { ApiPathSelect } from './ApiPathSelect/ApiPathSelect';
import { styles } from './ApiPathSelectionSection.styles';

interface Props {
  parameters: AppInstallationParameters;
  paths: Path[];
  dispatch: Dispatch<ParameterAction>;
}

export const ApiPathSelectionSection = ({ parameters, dispatch, paths }: Props) => {
  const { helpText } = copies.configPage.pathSelectionSection;
  return (
    <Box data-testid="api-path-selection-section" className={styles.box}>
      <ApiPathSelect parameters={parameters} dispatch={dispatch} paths={paths} />
      <HelpText className={styles.helpText}>{helpText}</HelpText>
    </Box>
  );
};
