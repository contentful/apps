import { FeaturedModel } from "@configs/aws/featuredModels";

export const modelNotInRegionError = (
  models: FeaturedModel[],
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

export const modelNotInAccountError = (models: FeaturedModel[]) => {
  let t = "The ";
  t += models.length > 1 ? " models " : " model ";
  t += models.map((m) => m.name).join(", ");
  t += models.length > 1 ? " have " : " has ";
  t += "not been granted access in your account. ";
  return t;
};
