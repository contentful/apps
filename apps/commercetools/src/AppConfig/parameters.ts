import get from "lodash/get";
import { ConfigurationParameters, Hash } from "../interfaces";

export function toInputParameters(
  parameterDefinitions: Hash[],
  parameterValues: Hash | null
): Record<string, string> {
  return parameterDefinitions.reduce((acc, def) => {
    const isFieldsConfig = !def.id || typeof def.id === "object";
    const defaultValue =
      typeof def.default === "undefined" ? "" : `${def.default}`;
    return isFieldsConfig
      ? acc
      : {
          ...acc,
          [def.id]: `${get(parameterValues, [def.id], defaultValue)}`
        };
  }, {});
}

export function toAppParameters(
  parameterDefinitions: Hash[],
  inputValues: Record<string, string>
): Hash {
  return parameterDefinitions.reduce((acc, def) => {
    const value = inputValues[def.id];
    return {
      ...acc,
      [def.id]: value
    };
  }, {});
}

export const parameterDefinitions = [
  {
    id: "projectKey",
    name: "commercetools Project Key",
    description: "The commercetools project key",
    type: "Symbol",
    required: true
  },
  {
    id: "clientId",
    name: "Client ID",
    description: "The client ID",
    type: "Symbol",
    required: true
  },
  {
    id: "clientSecret",
    name: "Client Secret",
    description: "The client secret",
    type: "Symbol",
    required: true
  },
  {
    id: "apiEndpoint",
    name: "API URL",
    description: "The commercetools API URL",
    type: "Symbol",
    required: true
  },
  {
    id: "authApiEndpoint",
    name: "Auth URL",
    description: "The auth API URL",
    type: "Symbol",
    required: true
  },
  {
    id: "locale",
    name: "commercetools data locale",
    description: "The commercetools data locale to display",
    type: "Symbol",
    required: true
  }
];

export function validateParameters(
  parameters: ConfigurationParameters
): string | null {
  if (get(parameters, ["projectKey"], "").length < 1) {
    return "Provide your commercetools project key.";
  }

  if (get(parameters, ["clientId"], "").length < 1) {
    return "Provide your commercetools client ID.";
  }

  if (get(parameters, ["clientSecret"], "").length < 1) {
    return "Provide your commercetools client secret.";
  }

  if (get(parameters, ["apiEndpoint"], "").length < 1) {
    return "Provide the commercetools API URL.";
  }

  if (get(parameters, ["authApiEndpoint"], "").length < 1) {
    return "Provide the commercetools auth API URL.";
  }

  if (get(parameters, ["locale"], "").length < 1) {
    return "Provide the commercetools data locale.";
  }

  return null;
}
