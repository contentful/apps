import GenericChecklistRow from 'components/config-screen/api-access/display/GenericCheckRow';
import { ChecklistRow } from 'components/config-screen/api-access/display/ChecklistUtils';
import tokens from '@contentful/f36-tokens';
import { Box } from '@contentful/f36-components';

interface Props {
  serviceAccountCheck: ChecklistRow;
  adminApiCheck: ChecklistRow;
  dataApiCheck: ChecklistRow;
  ga4PropertiesCheck: ChecklistRow;
}

const styles = {
  defaultRowStyle: {
    minHeight: '35px',
    backgroundColor: tokens.gray100,
    border: `1px solid ${tokens.gray300}`,
  },
  nonTopRowStyle: {
    borderTop: 'none',
  },
};

export default function ServiceAccountChecklist(props: Props) {
  const { adminApiCheck, dataApiCheck, serviceAccountCheck, ga4PropertiesCheck } = props;

  return (
    <Box marginTop="spacingS">
      <GenericChecklistRow
        icon={serviceAccountCheck.icon}
        title={serviceAccountCheck.title}
        description={serviceAccountCheck.description}
        checklistUrl={serviceAccountCheck.checklistUrl}
        disabled={serviceAccountCheck.disabled}
        style={styles.defaultRowStyle}
      />
      <GenericChecklistRow
        icon={adminApiCheck.icon}
        title={adminApiCheck.title}
        description={adminApiCheck.description}
        checklistUrl={adminApiCheck.checklistUrl}
        disabled={adminApiCheck.disabled}
        style={{ ...styles.defaultRowStyle, ...styles.nonTopRowStyle }}
      />
      <GenericChecklistRow
        icon={dataApiCheck.icon}
        title={dataApiCheck.title}
        description={dataApiCheck.description}
        checklistUrl={dataApiCheck.checklistUrl}
        disabled={dataApiCheck.disabled}
        style={{ ...styles.defaultRowStyle, ...styles.nonTopRowStyle }}
      />
      <GenericChecklistRow
        icon={ga4PropertiesCheck.icon}
        title={ga4PropertiesCheck.title}
        description={ga4PropertiesCheck.description}
        checklistUrl={ga4PropertiesCheck.checklistUrl}
        disabled={ga4PropertiesCheck.disabled}
        style={{ ...styles.defaultRowStyle, ...styles.nonTopRowStyle }}
      />
    </Box>
  );
}
