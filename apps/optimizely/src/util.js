import { fieldNames } from "./constants";

export const getProjectType = (sdk) => {
  return sdk.parameters.installation.optimizelyProjectType;
};

export const entryHasField = (entry, field) => {
  return !!entry.fields[field];
};

export const entryHasFields = (entry, fields) => {
  return fields.reduce((v, f) => v && entryHasField(entry, f), true);
};

export const entryHasFxFields = (entry) => {
  return entryHasFields(entry, [fieldNames.environment, fieldNames.flagKey, fieldNames.revision]);
};
export const checkAndGetField = (entry, field) => {
  if (entryHasField(entry, field)) {
    return entry.fields[field].getValue();
  }
  return undefined;
}

export const checkAndSetField = async (entry, field, value) => {
  if (entryHasField(entry, field)) {
    return entry.fields[field].setValue(value);
  }
}

export const randStr = () => {
  return Math.random().toString(36).substring(2)
}

export function isCloseToExpiration(expires) {
  const _10minutes = 600000;
  return parseInt(expires, 10) - Date.now() <= _10minutes;
}

export const resolvablePromise = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, resolve, reject };
};

export const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
