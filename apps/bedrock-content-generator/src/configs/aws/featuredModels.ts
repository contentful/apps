export interface FeaturedModel {
  id: string;
  name: string;
}

export const featuredModels: FeaturedModel[] = [
  {
    id: "anthropic.claude-v2:1",
    name: "Anthropic Claude v2.1",
  },
  {
    id: "anthropic.claude-instant-v1",
    name: "Anthropic Claude Instant v1.2",
  },
  // {
  //   id: "meta.llama2-70b-chat-v1",
  //   name: "Meta Llama 2 70B",
  // },
];

export const defaultModelId = featuredModels[1].id;
