import React, { useEffect, useReducer } from 'react';
import { Paragraph, Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { reducer, initialSidebarState } from '../model/reducerAndInitialSidebarState';

const Sidebar = () => {
  const sdk = useSDK();
  const [state, dispatch] = useReducer(reducer, {}, initialSidebarState);
  /*
     To use the cma, access it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = sdk.cma;

  useEffect(() => {
    dispatch({
      type: 'SET_TIME',
      payload: new Date().toString(),
    });
  }, []);

  const someParameter = 'some parameter';

  return (
    <>
      <Paragraph>Hello Sidebar Component (AppId: {sdk.ids.app})</Paragraph>
      <Paragraph>{`Time is ${state.timestamp}`}</Paragraph>
      <Button
        onClick={() => {
          dispatch({
            type: 'SET_TIME',
            payload: new Date().toString(),
          });
        }}>
        SET TIME
      </Button>
      <Button
        onClick={async () => {
          const serializedDialogState = await sdk.dialogs.openCurrentApp({
            shouldCloseOnEscapePress: false,
            shouldCloseOnOverlayClick: false,
            title: 'Dialog',
            minHeight: 360,
            parameters: {
              serializedSidebarState: JSON.stringify(state),
            },
          });
          if (serializedDialogState) {
            dispatch({
              type: 'SET_WHOLE_STATE',
              payload: JSON.parse(serializedDialogState),
            });
          }
        }}>
        OPEN DIALOG
      </Button>
    </>
  );
};

export default Sidebar;
