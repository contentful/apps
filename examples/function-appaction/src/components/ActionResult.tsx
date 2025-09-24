import { useState } from 'react';
import ActionFailure from './ActionFailure';
import ActionSuccess from './ActionSuccess';
import { useClipboard } from '../hooks/useClipboard';
import { AppActionCallProps } from 'contentful-management';
interface Props {
  appActionCall: AppActionCallProps;
}

const ActionResult = (props: Props) => {
  const [accordionState, setAccordionState] = useState<any>({});

  const { appActionCall } = props;
  const success = appActionCall.sys.status === 'succeeded';
  const { copy } = useClipboard();

  const handleExpand = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: true }));

  const handleCollapse = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: false }));

  const handleCopy = (text: string, entityDescription: string) => copy(text, entityDescription);

  return (
    <>
      {success ? (
        <ActionSuccess
          accordionState={accordionState}
          appActionCall={appActionCall}
          handleCollapse={handleCollapse}
          handleExpand={handleExpand}
          handleCopy={handleCopy}
        />
      ) : (
        <ActionFailure
          accordionState={accordionState}
          appActionCall={appActionCall}
          handleCollapse={handleCollapse}
          handleExpand={handleExpand}
        />
      )}
    </>
  );
};

export default ActionResult;
