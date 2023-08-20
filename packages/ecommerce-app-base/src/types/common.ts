export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue> | undefined;

export interface JSONObject {
  [key: string]: JSONValue;
}
