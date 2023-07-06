import { ParameterDefinition } from '../interfaces';
import { toInputParameters } from './parameters';

const mockParameterDefinition: ParameterDefinition = {
  id: 'someTestid',
  name: 'some-name',
  description: 'some description',
  default: 'some-default-text',
  type: 'Symbol',
  required: true,
};

describe.skip('parameters', () => {
  describe('toInputParameters', () => {
    it('handles lack of parameters', () => {
      const parameterDefinitions: ParameterDefinition[] = [mockParameterDefinition];
      const result = toInputParameters(parameterDefinitions, {});

      expect(result).toEqual({
        someTestid: 'some-default-text',
      });
    });

    it('resolves parameters to string values', () => {
      const parameterDefinitions: ParameterDefinition[] = [mockParameterDefinition];
      const result = toInputParameters(parameterDefinitions, {
        id: 'some-key',
        name: 'some-key-name',
        description: 'some description',
        default: '',
        type: 'Symbol',
        required: true,
      });

      expect(result).toEqual({
        someTestid: 'some-default-text',
      });
    });
  });
});
