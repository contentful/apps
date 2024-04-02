import { describe, expect, it } from 'vitest';
import { BedrockModel, featuredModels } from './featuredModels';

describe('featuredModels', () => {
  it('should generate correct schema for Claude', () => {
    const model = featuredModels.find((m: BedrockModel) => m.name.includes('Claude'))!;

    const command = model.invokeCommand('', '', 1);

    const body = JSON.parse(command.body.toString());

    expect(body).toHaveProperty('max_tokens');
  });
  it('should generate correct schema for Llama', () => {
    const model = featuredModels.find((m: BedrockModel) => m.name.includes('Llama'))!;

    const command = model.invokeCommand('', '', 1);

    const body = JSON.parse(command.body.toString());

    expect(body).toHaveProperty('max_gen_len');
  });
});
