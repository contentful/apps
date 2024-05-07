import { useQuery } from '@tanstack/react-query';
import { CharacterAttributes, CharacterProps } from '../types';


async function fetchCharacters(filter: string): Promise<CharacterAttributes[]> {
  const characterProps: CharacterProps[] = await fetch(
    `https://api.potterdb.com/v1/characters?filter[name_cont]=${filter}`
  )
    .then((response) => response.json())
    .then((data) => data.data);

  return characterProps
    .map((character) => ({ ...character.attributes }))
    .filter((character) => character.image !== null);
}

type HookResult = {
  characters?: CharacterAttributes[];
  isLoading: boolean;
};

export function useCharacters(filter: string): HookResult {
  const { isLoading, data: characters } = useQuery<CharacterAttributes[]>({
    queryKey: ['characters', filter],
    queryFn: () => fetchCharacters(filter),
    retry: false,
  });

  return { characters, isLoading };
}
