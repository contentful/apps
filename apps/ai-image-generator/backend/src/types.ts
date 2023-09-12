export interface Dimensions {
  width: number;
  height: number;
  ratio: number;
  layout: 'portrait' | 'landscape' | 'square';
}

export interface Image {
  url: string;
  imageType: string;
}

export interface ActionError {
  type: string;
  message: string;
  details?: Record<string, any>;
}

export interface AppActionCallResponseSuccess<TResult> {
  ok: true;
  data: TResult;
}

export interface AppActionCallResponseError {
  ok: false;
  errors: ActionError[];
}

export type AppActionCallResponse<T> = AppActionCallResponseSuccess<T> | AppActionCallResponseError;
