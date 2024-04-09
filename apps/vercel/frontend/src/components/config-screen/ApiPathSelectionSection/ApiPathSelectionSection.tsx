import { Box, Heading, Paragraph } from '@contentful/f36-components';
import { Dispatch } from 'react';

import { ParameterAction } from '@components/parameterReducer';
import { copies } from '@constants/copies';
import { AppInstallationParameters, Path } from '@customTypes/configPage';
import { styles } from '../ConfigScreen.styles';
import { ApiPathSelect } from './ApiPathSelect/ApiPathSelect';

interface Props {
  parameters: AppInstallationParameters;
  paths: Path[];
  dispatch: Dispatch<ParameterAction>;
}

export const ApiPathSelectionSection = ({ parameters, dispatch, paths }: Props) => {
  const { heading, subHeading, footer } = copies.configPage.pathSelectionSection;
  return (
    <Box data-testid="api-path-selection-section" className={styles.box}>
      <Heading marginBottom="none" className={styles.heading}>
        {heading}
      </Heading>
      <Paragraph marginTop="spacingXs">{subHeading}</Paragraph>
      <ApiPathSelect parameters={parameters} dispatch={dispatch} paths={paths} />
      <Paragraph>{footer}</Paragraph>
    </Box>
  );
};
