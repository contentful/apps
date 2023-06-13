import { Box, Button, Grid } from '@contentful/f36-components';
import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import FieldJsonEditor from '../FieldJsonEditor/FieldJsonEditor';
import ResourceFieldContext from 'context/ResourceFieldContext';
import SortableResourceList from '../SortableResourceList/SortableResourceList';
import useResourceValue from 'hooks/field/useResourceValue';
import { FieldAppSDK } from '@contentful/app-sdk';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';
import { styles } from './ResourceField.styles';

const ResourceField = () => {
  const { isMultiple, handleAddResource, logoUrl } = useContext(ResourceFieldContext);
  const { value } = useResourceValue(isMultiple);
  const sdk = useSDK<FieldAppSDK>();
  const { linkType } = sdk.parameters.instance;
  const { resourceType } = getResourceProviderAndType(linkType);

  const getButtonText = () => {
    if (isMultiple) return `Add ${resourceType}s`;
    return value.length ? `Edit ${resourceType}` : `Add ${resourceType}`;
  };

  return (
    <Grid>
      <SortableResourceList resourceArray={value} />
      <Grid.Item>
        <Box marginBottom="spacingM">
          <Button onClick={handleAddResource}>
            {logoUrl && <img src={logoUrl} alt="App logo" className={styles.icon} />}
            {getButtonText()}
          </Button>
        </Box>
      </Grid.Item>
      <Grid.Item>
        <FieldJsonEditor />
      </Grid.Item>
    </Grid>
  );
};

export default ResourceField;
