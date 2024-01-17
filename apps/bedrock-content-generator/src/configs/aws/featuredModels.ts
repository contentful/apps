import { BedrockModel } from "@components/config/model/Model";

export const featuredModels: BedrockModel[] = [
  {
    id: "anthropic.claude-v2:1",
    name: "Anthropic Claude v2.1",
    family: "CLAUDE",
  },
  {
    id: "anthropic.claude-instant-v1",
    name: "Anthropic Claude Instant v1.2",
    family: "CLAUDE",
  },
  {
    id: "meta.llama2-70b-chat-v1",
    name: "Meta Llama 2 70B",
    family: "LLAMA",
  },
];

export const defaultModelId = featuredModels[1].id;
