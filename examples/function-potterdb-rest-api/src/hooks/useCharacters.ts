import { useQuery } from '@tanstack/react-query';
import { CharacterAttributes, CharacterProps } from '../types';

async function fetchCharacters(): Promise<CharacterAttributes[]> {
      const characterProps:  Promise<CharacterProps[]> = await fetch("https://api.potterdb.com/v1/characters?page[size]=25")
      .then(response => response.json())
      .then(data => data.data)

      return (await characterProps).map((character) => ({ ...character.attributes }))
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



