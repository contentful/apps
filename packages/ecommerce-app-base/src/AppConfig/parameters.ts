import get from 'lodash/get';

import { Config, ParameterDefinition } from '../interfaces';

export function toInputParameters(
  parameterDefinitions: ParameterDefinition[],
  parameterValues: Config | null
): Record<string, string> {
  return parameterDefinitions.reduce((acc, def) => {
    const defaultValue = typeof def.default === 'undefined' ? '' : `${def.default}`;
    return {
      ...acc,
      [def.id]: `${get(parameterValues, [def.id], defaultValue)}`,
    };
  }, {});
}

export function toAppParameters(
  parameterDefinitions: ParameterDefinition[],
  inputValues: Record<string, string>
): Config {
  return parameterDefinitions.reduce((acc, def) => {
    const value = inputValues[def.id];
    return {
      ...acc,
      [def.id]: def.type === 'Number' ? parseInt(value, 10) : value,
    };
  }, {});
}
