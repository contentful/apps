import { UploadProps } from 'contentful-management';
import sharp from 'sharp';

export type Layouts = 'portrait' | 'landscape' | 'square';

export interface Dimensions {
  width: number;
  height: number;
  ratio: number;
  layout: Layouts;
}

export interface Image {
  url: string;
  imageType: string;
}

export interface ImageWithStream extends Image {
  stream: sharp.Sharp;
}

export interface ImageWithUpload extends Image {
  upload: Upload;
  size: number;
  dimensions: Dimensions;
}

export interface Upload extends UploadProps {
  url: string;
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
