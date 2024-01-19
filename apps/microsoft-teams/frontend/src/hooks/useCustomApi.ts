import { CustomApi, CustomApiContext } from '@context/SdkWithCustomApiProvider';
import { useContext } from 'react';

export function useCustomApi(): CustomApi {
  const { customApi } = useContext(CustomApiContext);

  if (!customApi) {
    throw new Error(
      'API context not found. Make sure this hook is used inside the SdkWithCustomApiProvider'
    );
  }

  return customApi;
}
