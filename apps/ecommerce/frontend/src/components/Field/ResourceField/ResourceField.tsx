import { useContext } from 'react';
import { Grid } from '@contentful/f36-components';
import { AddContentButton } from './AddContentButton';
import SortableResourceList from './SortableResourceList';
import FieldJsonEditor from './FieldJsonEditor';
import ResourceFieldContext from 'context/ResourceFieldContext';

const ResourceField = () => {
  const { resourceArray, isMultiple } = useContext(ResourceFieldContext);

  return (
    <Grid rowGap="spacingM">
      <SortableResourceList />
      <Grid.Item>{(isMultiple || !resourceArray.length) && <AddContentButton />}</Grid.Item>
      <Grid.Item>
        <FieldJsonEditor />
      </Grid.Item>
    </Grid>
  );
};

export default ResourceField;
