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
    name: "Commercetools Project Key",
    description: "The Commercetools project key",
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
    name: "API Endpoint",
    description: "The Commercetools API endpoint",
    type: "Symbol",
    required: true
  },
  {
    id: "authApiEndpoint",
    name: "Auth API Endpoint",
    description: "The auth API endpoint",
    type: "Symbol",
    required: true
  },
  {
    id: "locale",
    name: "Commercetools data locale",
    description: "The Commercetools data locale to display",
    type: "Symbol",
    required: true
  }
];

export function validateParameters(
  parameters: ConfigurationParameters
): string | null {
  if (get(parameters, ["projectKey"], "").length < 1) {
    return "Provide your Commercetools project key.";
  }

  if (get(parameters, ["clientId"], "").length < 1) {
    return "Provide your Commercetools client ID.";
  }

  if (get(parameters, ["clientSecret"], "").length < 1) {
    return "Provide your Commercetools client secret.";
  }

  if (get(parameters, ["apiEndpoint"], "").length < 1) {
    return "Provide the Commercetools API endpoint.";
  }

  if (get(parameters, ["authApiEndpoint"], "").length < 1) {
    return "Provide the Commercetools auth API endpoint.";
  }

  if (get(parameters, ["locale"], "").length < 1) {
    return "Provide the Commercetools data locale.";
  }

  return null;
}
