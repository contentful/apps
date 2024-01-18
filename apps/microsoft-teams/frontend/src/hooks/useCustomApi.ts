import { CustomApi, SDKWithCustomApiContext } from '@context/SdkWithCustomApiProvider';
import { useContext } from 'react';

export function useCustomApi(): CustomApi {
  const { customApi } = useContext(SDKWithCustomApiContext);

  if (!customApi) {
    throw new Error(
      'API context not found. Make sure this hook is used inside the SdkWithCustomApiProvider'
    );
  }

  return customApi;
}
