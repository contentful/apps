import { useQuery } from '@tanstack/react-query';

async function fetchCharacters() {
    return fetch("https://api.potterdb.com/v1/characters?page[size]=25")
      .then(response => response.json())
      .then(data => data.data)
  }

type HookResult = {
  characters?: any[];
  isLoading: boolean;
};

type Character =  {
    slug: string
    name?: string
    aliasNames: string[]
    familyMembers: string[]
    house: string
    image: string
    titles: string[]
    wiki: string
  }

export function useProducts(): HookResult {

  const { isLoading, data: characters } = useQuery<Character[]>({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    retry: false,
  });

  return { characters, isLoading };
}



