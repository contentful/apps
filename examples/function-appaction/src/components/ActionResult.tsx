import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';
import ActionFailure from './ActionFailure';
import ActionSuccess from './ActionSuccess';
import { useClipboard } from '../hooks/useClipboard';

interface Props {
  actionResult: ActionResultType;
}

const ActionResult = (props: Props) => {
  const [accordionState, setAccordionState] = useState<any>({});

  const { actionResult } = props;
  const { success } = actionResult;
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
          actionResult={actionResult}
          handleCollapse={handleCollapse}
          handleExpand={handleExpand}
          handleCopy={handleCopy}
        />
      ) : (
        <ActionFailure
          accordionState={accordionState}
          actionResult={actionResult}
          handleCollapse={handleCollapse}
          handleExpand={handleExpand}
        />
      )}
    </>
  );
};

export default ActionResult;
