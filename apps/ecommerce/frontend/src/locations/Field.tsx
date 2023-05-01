import { FieldAppSDK, init } from '@contentful/app-sdk';
import { /* useCMA, */ useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import MultipleResources from '../components/MultipleResources';
import SingleResource from '../components/SingleResource';
// import * as DefaultFieldEditors from '@contentful/default-field-editors';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  useAutoResizer();

  // TODO: rescue any failed react render and render default field editor
  // try {
  return sdk.parameters.instance.fieldType === 'multiple' ? (
    <MultipleResources />
  ) : (
    <SingleResource />
  );
  // } catch (error) {
  //   return <DefaultFieldEditors.Field sdk={sdk} />;
  // }
};

export default Field;
