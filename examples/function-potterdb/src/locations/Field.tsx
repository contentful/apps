import { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@contentful/f36-components';
import { useCharacter } from '../hooks/useCharacter';
import { CharacterAttributes } from '../types';
import { CharacterDetails } from '../components/CharacterDetails';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const [characterSlug, setCharacterSlug] = useFieldValue<string>(sdk.field.id, sdk.field.locale);
  const { isLoading, character } = useCharacter(characterSlug);

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
    return <CharacterDetails onClick={() => ({})} />;
  }

  if (!character) {
    return <Button onClick={openModal}>Select Character</Button>;
  }

  return (
    <div>
      <CharacterDetails character={character} onClick={removeCharacter} />
      <Button style={{ marginTop: '32px' }} onClick={openModal}>
        Select Character
      </Button>
    </div>
  );
};

export default Field;
