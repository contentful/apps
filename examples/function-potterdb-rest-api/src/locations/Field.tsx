import React, { useEffect } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@contentful/f36-components';
import { useCharacter } from '../hooks/useCharacter';
import { CharacterBox } from '../components/CharacterBox';
import { CharacterAttributes } from '../types';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const [characterSlug, setCharacterSlug] = useFieldValue<string>(sdk.field.id, sdk.field.locale);
  const { isLoading, character } = useCharacter(characterSlug);

  useEffect(() => {
    // Since we run in an iframe,
    // we need to set the height of the iframe.
    sdk.window.updateHeight(130);
  }, [sdk.window]);

  async function openModal() {
    const character: CharacterAttributes = await sdk.dialogs.openCurrentApp();
    if (character) {
      setCharacterSlug(character.slug).catch(() => null);
    }
  }

  async function removeCharacter() {
    setCharacterSlug(undefined).catch(() => null);
  }

  if (isLoading) {
    return <CharacterBox />;
  }

  if (!character) {
    // TODO: Modal to select the character
    return <Button onClick={openModal}>Select Character</Button>;
  }

  return (
    <div>
      <CharacterBox character={character} onClick={removeCharacter} ctaText="Remove" />
      <Button onClick={openModal}>Select Character</Button>
    </div>
  );
};

export default Field;
