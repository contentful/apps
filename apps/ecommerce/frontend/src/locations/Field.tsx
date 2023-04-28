import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import MultipleResources from '../components/MultipleResources';
import SingleResource from '../components/SingleResource';
import { useEffect } from 'react';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  return sdk.parameters.instance.fieldType === 'multiple' ? (
    <MultipleResources />
  ) : (
    <SingleResource />
  );
};

export default Field;
