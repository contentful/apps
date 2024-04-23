import { useEffect } from 'react';
import React from 'react';
import { Box, Button, Modal } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { useCharacters } from '../hooks/useCharacters';
import { CharacterBox } from '../components/CharacterBox';
import { CharactersList } from '../components/CharactersList';
import { CharacterAttributes } from '../types';


const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const { isLoading, characters } = useCharacters();

  console.log("Dialog")
  console.log({ characters })

  useEffect(() => {
    // Since we run in an iframe, we need to set the height of the iframe.
    sdk.window.updateHeight(500);
  }, [sdk.window]);

  if (isLoading && !characters) {
    return new Array(10).fill(undefined).map((_, index) => <CharacterBox key={index} />);
  }

  function selectCharacter(character?: CharacterAttributes) {
    sdk.close(character);
  }

  return (
    <Box padding="spacingM">
      <Modal.Header title="Select a product">
        <Button onClick={() => selectCharacter(undefined)}>Dismiss</Button>
      </Modal.Header>
      <Modal.Content>
        <CharactersList characters={characters} onSelect={selectCharacter} />
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={() => selectCharacter(undefined)}>Dismiss</Button>
      </Modal.Controls>
    </Box>
  );
};

export default Dialog;
