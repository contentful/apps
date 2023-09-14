import { UploadProps } from 'contentful-management';
import sharp from 'sharp';

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

export interface ImageWithStream extends Image {
  stream: sharp.Sharp;
}

export interface ImageWithUpload extends Image {
  upload: Upload;
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
