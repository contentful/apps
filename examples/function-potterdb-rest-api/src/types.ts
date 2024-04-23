

export type CharacterAttributes =  {
    slug: string
    name?: string
    gender?: string
    born?: string
    species?: string
    nationality?: string
    aliasNames: string[]
    familyMembers: string[]
    house?: string
    image?: string
    titles?: string[]
    jobs?: string[]
    wiki: string
  }


export type CharacterProps = {
    id: string
    type: "Character"
    attributes: CharacterAttributes
}