import { useContext } from 'react';
import { SDKContext } from '../index';

export function useSDK<T>() {
  return useContext(SDKContext) as T;
}
