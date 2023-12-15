const gptModels = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5', textLimit: 12000 },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 16k', textLimit: 12000 },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-4-32k', name: 'GPT-4 32k' },
];

const defaultModelId = gptModels[0].id;

export { gptModels, defaultModelId };
