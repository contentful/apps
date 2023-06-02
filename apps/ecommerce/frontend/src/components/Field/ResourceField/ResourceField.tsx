import { AddContentButton } from './AddContentButton';
import { Grid, Box, Button } from '@contentful/f36-components';
import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import FieldJsonEditor from './FieldJsonEditor';
import ResourceFieldContext from 'context/ResourceFieldContext';
import SortableResourceList from './SortableResourceList';
import useResourceValue from 'hooks/field/useResourceValue';
import { FieldAppSDK } from '@contentful/app-sdk';
import { getResourceProviderAndType } from 'helpers/resourceProviderUtils';

const ResourceField = () => {
  const { isMultiple, handleAddResource } = useContext(ResourceFieldContext);
  const { value } = useResourceValue(isMultiple);
  const sdk = useSDK<FieldAppSDK>();
  const { linkType } = sdk.parameters.instance;
  const { resourceType } = getResourceProviderAndType(linkType);
  const buttonText = isMultiple ? `Add ${resourceType}s` : `Add a ${resourceType}`;

  return (
    <Grid>
      <SortableResourceList resourceArray={value} />
      {(isMultiple || !value.length) && (
        <Grid.Item>
          <AddContentButton />
        </Grid.Item>
      )}
      <Grid.Item>
        <Box marginBottom="spacingM">
          <Button onClick={handleAddResource}>{buttonText}</Button>
        </Box>
      </Grid.Item>
      <Grid.Item>
        <FieldJsonEditor />
      </Grid.Item>
    </Grid>
  );
};

export default ResourceField;
