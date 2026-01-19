/// <reference types="vite/client" />

import { ContentType } from "./types";

export type AppParameters = {
  cloneText: string;
  cloneTextBefore: boolean;
  automaticRedirect: boolean;
  referenceOnlyComponents: ContentType[];
};
