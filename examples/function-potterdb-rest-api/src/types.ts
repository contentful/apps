

export type CharacterAttributes =  {
    slug: string
    name?: string
    aliasNames: string[]
    familyMembers: string[]
    house: string
    image: string
    titles: string[]
    wiki: string
  }


export type CharacterProps = {
    id: string
    type: "Character"
    attributes: CharacterAttributes
}