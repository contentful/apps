import { useQuery } from '@tanstack/react-query';
import { CharacterAttributes } from '../types';

async function fetchCharacter(slug: string) {
    return fetch(`https://api.potterdb.com/v1/characters/${slug}`)
      .then(response => response.json())
      .then(data => data.data)
  }


type HookResult = {
  character?: CharacterAttributes;
  isLoading: boolean;
};



export function useCharacter(slug: string = ''): HookResult {
  const { isLoading, data: character } = useQuery<CharacterAttributes>({
    queryKey: ['slug', slug],
    queryFn: () => fetchCharacter(slug),
    enabled: !!slug,
  });

  return { character, isLoading };
}
