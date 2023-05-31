import { AddContentButton } from './AddContentButton';
import { Grid } from '@contentful/f36-components';
import { useContext } from 'react';
import FieldJsonEditor from './FieldJsonEditor';
import ResourceFieldContext from 'context/ResourceFieldContext';
import SortableResourceList from './SortableResourceList';
import useResourceValue from 'hooks/field/useResourceValue';

const ResourceField = () => {
  const { isMultiple } = useContext(ResourceFieldContext);
  const { value } = useResourceValue(isMultiple);

  return (
    <Grid>
      <SortableResourceList resourceArray={value} />
      {(isMultiple || !value.length) && (
        <Grid.Item>
          <AddContentButton />
        </Grid.Item>
      )}
      <Grid.Item>
        <FieldJsonEditor />
      </Grid.Item>
    </Grid>
  );
};

export default ResourceField;
