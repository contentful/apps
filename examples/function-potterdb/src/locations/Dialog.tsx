import { useEffect, useState } from 'react';
import React from 'react';
import { Box, Button, Form, FormControl, Modal, TextInput } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { useCharacters } from '../hooks/useCharacters';
import { CharacterBox } from '../components/CharacterBox';
import { CharactersList } from '../components/CharactersList';
import { CharacterAttributes } from '../types';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  const [filter, setFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const handleChange = (filter: string) => {
    setFilter(filter);
  };

  const handleSubmit = () => {
    setSearchText(filter);
  };

  const { isLoading, characters } = useCharacters(searchText);

  useEffect(() => {
    // Since we run in an iframe, we need to set the height of the iframe.
    sdk.window.updateHeight(680);
  }, [sdk.window]);

  if (isLoading && !characters) {
    return new Array(10)
      .fill(undefined)
      .map((_, index) => <CharacterBox key={index} onClick={() => ({})} />);
  }

  function selectCharacter(character?: CharacterAttributes) {
    sdk.close(character);
  }

  return (
    <Box padding="spacingM">
      <Modal.Header title="Select a Character">
        <Button onClick={() => selectCharacter(undefined)}>Dismiss</Button>
      </Modal.Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit}>
          <FormControl>
            <FormControl.Label>Character 🪄</FormControl.Label>
            <TextInput
              value={filter}
              placeholder="Search for a character"
              onChange={(e) => handleChange(e.target.value)}
            />
          </FormControl>
        </Form>
        <CharactersList characters={characters} onSelect={selectCharacter} />
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={() => selectCharacter(undefined)}>Dismiss</Button>
      </Modal.Controls>
    </Box>
  );
};

export default Dialog;
