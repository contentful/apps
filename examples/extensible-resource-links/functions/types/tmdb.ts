type Person = {
  id: number;
  name: string;
  profile_path: string;
};

type Movie = {
  id: number;
  title: string;
  poster_path: string;
};

export type TmdbItem = Movie | Person;

export type Resource = {
  urn: string;
  name: string;
  image?: {
    url: string;
  };
  externalUrl: string;
};

export type TmdbLookupResponse = TmdbItem;

export type TmdbSearchResponse = {
  results: TmdbItem[];
  total_pages: number;
  page: number;
};
