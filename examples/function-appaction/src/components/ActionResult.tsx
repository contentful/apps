import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';
import ActionFailure from './ActionFailure';
import ActionSuccess from './ActionSuccess';

interface Props {
  actionResult: ActionResultType;
}

const ActionResult = (props: Props) => {
  const [accordionState, setAccordionState] = useState<any>({});
  const sdk = useSDK<PageAppSDK>();

  const { actionResult } = props;
  const { success } = actionResult;

  const handleExpand = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: true }));

  const handleCollapse = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: false }));

  const handleCopy = (text: string, entityDescription: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        sdk.notifier.success(`Copied ${entityDescription || 'item'} to clipboard.`);
      },
      () => {
        sdk.notifier.error(`Failed to copy ${entityDescription || 'item'} to clipboard.`);
      }
    );
  };

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
