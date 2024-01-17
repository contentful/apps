import { BedrockModel } from "./Model";

export const modelNotInRegionError = (
  models: BedrockModel[],
  region: string,
) => {
  let t = "The ";
  t += models.length > 1 ? " models " : " model ";
  t += models.map((m) => m.name).join(", ");
  t += models.length > 1 ? " are " : " is ";
  t += "not available in the ";
  t += region;
  t += " region.";
  return t;
};

export const modelNotInAccountError = (models: BedrockModel[]) => {
  let t = "The ";
  t += models.length > 1 ? " models " : " model ";
  t += models.map((m) => m.name).join(", ");
  t += models.length > 1 ? " have " : " has ";
  t += "not been granted access in your account. ";
  return t;
};

export const modelForbiddenError = (models: BedrockModel[]) => {
  let t = "The ";
  t += models.length > 1 ? " models " : " model ";
  t += models.map((m) => m.name).join(", ");
  t += models.length > 1 ? " have " : " has ";
  t += "not been granted access in your account. ";
  return t;
};

export const modelOtherError = (models: BedrockModel[]) => {
  let t = "The ";
  t += models.length > 1 ? " models " : " model ";
  t += models.map((m) => m.name).join(", ");
  t += " could not be accessed for an unexpected reason.";
  t +=
    models.length > 1
      ? " The error for the first of these models is: "
      : " The error is: ";
  return t;
};
