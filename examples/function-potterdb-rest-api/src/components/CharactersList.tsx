import type { ReactElement } from 'react';
import { List } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

import { CharacterBox } from './CharacterBox';
import { CharacterAttributes } from '../types';

const styles = {
  characterList: css`
    padding: 0;
  `,
  characterItemContainer: css`
    max-height: 200px;
  `,
  characterItem: css`
    max-height: 200px;
    box-sizing: border-box;
    padding: ${tokens.spacingS} 0;
    list-style: none;
    &:hover {
      border-color: ${tokens.blue500};
    }
  `,
};

type Props = {
  characters?: CharacterAttributes[];
  onSelect: (product: CharacterAttributes) => void;
};

export function CharactersList({ characters = [], onSelect }: Props): ReactElement {
  return (
    <List className={styles.characterList}>
      {characters?.map((character) => (
        <List.Item key={character.slug} className={styles.characterItem}>
          <CharacterBox character={character} onClick={() => onSelect(character)} />
        </List.Item>
      ))}
    </List>
  );
}
