import React, { useEffect, useReducer } from 'react';
import { Paragraph, Button } from '@contentful/f36-components';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { reducer } from '../model/reducerAndInitialSidebarState';

const Dialog = () => {
  const sdk = useSDK();
  const { serializedSidebarState } = (sdk.parameters.invocation || {});
  const [state, dispatch] = useReducer(reducer, {});
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  useEffect(() => {
    dispatch({
      type: 'SET_WHOLE_STATE',
      payload: JSON.parse(serializedSidebarState),
    });
  }, []);

  return <>
    <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>
    <Paragraph>{`Time is ${state.timestamp}`}</Paragraph>
    <Button onClick={() => {
      dispatch({
        type: 'SET_TIME',
        payload: new Date().toString(),
      });
    }}>SET TIME</Button>
    <Button
      onClick={() => {
        sdk.close(JSON.stringify(state));
      }}>CLOSE</Button>
  </>;
};

export default Dialog;
