import { expect } from 'chai';
import { handler } from './aiig-build-action';
import { makeMockAppActionCallContext } from '../../test/mocks';

describe('aiigBuildAction.handler', () => {
  const parameters = {
    prompt: 'My image text',
  };
  const context = makeMockAppActionCallContext();

  it('returns the images result', async () => {
    const result = await handler(parameters, context);
    expect(result).to.have.property('status', 201);
    expect(result).to.have.property('prompt', parameters.prompt);
    expect(result.images).to.include(
      'https://www.americanhumane.org/app/uploads/2021/12/Cat-8-1024x1024.png'
    );
  });
});
