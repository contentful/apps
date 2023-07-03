import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import DialogClass from '../DialogClass';

export const applicationInterfaceKey = 'xj823lbq';

const Dialog = () => {
  const sdk = useSDK();
  const cma = useCMA();

  return (
    <DialogClass
      cma={cma as any}
      sdk={sdk}
      applicationInterfaceKey={`${applicationInterfaceKey}`}
    />
  );
};

export default Dialog;
