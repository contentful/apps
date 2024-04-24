import { useQuery } from '@tanstack/react-query';
import { CharacterAttributes, CharacterProps } from '../types';

async function fetchCharacters(): Promise<CharacterAttributes[]> {
      const characterProps:  CharacterProps[] = await fetch("https://api.potterdb.com/v1/characters?page[size]=100")
      .then(response => response.json())
      .then(data => data.data)

      return characterProps
      .map((character) => ({ ...character.attributes }))
      .filter(character => character.image !== null)
  }

type HookResult = {
  characters?: CharacterAttributes[];
  isLoading: boolean;
};


export function useCharacters(): HookResult {

  const { isLoading, data: characters } = useQuery<CharacterAttributes[]>({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    retry: false,
  });

  return { characters, isLoading };
}



