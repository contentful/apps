export type CharacterAttributes = {
  slug: string;
  name?: string;
  gender?: string;
  born?: string;
  species?: string;
  nationality?: string;
  house?: string;
  image?: string;
  familyMembers: string[];
  aliasNames: string[];
  titles?: string[];
  jobs?: string[];
  wiki: string;
};

export type CharacterProps = {
  id: string;
  type: 'Character';
  attributes: CharacterAttributes;
};
