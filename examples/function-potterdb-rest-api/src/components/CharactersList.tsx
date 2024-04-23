import React from 'react';
import type { ReactElement } from 'react';
import { List } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';


import { Character } from '../hooks/useCharacters';
import { CharacterBox } from './CharacterBox';


const styles = {
  characterList: css`
    padding: 0;
  `,
  characterItemContainer: css`
    max-height: 100px;
  `,
  characterItem: css`
    max-height: 100px;
    box-sizing: border-box;
    padding: ${tokens.spacingS} 0;
    list-style: none;
    &:hover {
      background-color: ${tokens.gray100};
    }
  `,
};

type Props = {
  characters?: Character[];
  onSelect: (product: Character) => void;
};

export function CharactersList({ characters, onSelect }: Props): ReactElement {
  return (
    <List className={styles.characterList}>
      {characters?.map((character) => (
        <List.Item key={character.id} className={styles.characterItem}>
          <CharacterBox character={character} onClick={() => onSelect(character)} />
        </List.Item>
      ))}
    </List>
  );
}
