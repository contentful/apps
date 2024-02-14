import {
  AccountInfo,
  IPublicClientApplication,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { graphConfig } from '@configs/authConfig';

export interface MsGraphApiErrorType {
  message: string;
  status: number;
}

export class MsGraphApiError extends Error {
  status: number;

  constructor(res: MsGraphApiErrorType) {
    super(res.message ?? '');
    this.status = res.status;
  }
}

interface OrganizationalBrandingSuccessResponse {
  '@odata.context': string;
  cdnList: string[];
  faviconRelativeUrl: string;
  squareLogoRelativeUrl: string;
}

/**
 * This class is used to interact with the Microsoft Graph API.
 * Specifically we use this API to get the organization name and logo to display after a user authenticates
 * @param instance IPublicClientApplication, comes from useMsal hook
 * @param account AccountInfo, comes from useMsal hook
 */
class MsGraph {
  readonly baseUrl: string;
  readonly instance: IPublicClientApplication;
  readonly account: AccountInfo;
  readonly tenantId: string;

  constructor(instance: IPublicClientApplication, account: AccountInfo) {
    this.baseUrl = graphConfig.graphOrgEndpoint;
    this.instance = instance;
    this.account = account;
    this.tenantId = account.tenantId;
  }

  /**
   * Look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you using the cached refresh token
   * The silent token requests to Microsoft Entra ID might fail for reasons like a password change or updated Conditional Access policies, then call an interactive method
   * See: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md#acquiring-an-access-token
   * @returns string
   */
  private getAccessToken = async (): Promise<string> => {
    const request = {
      scopes: ['User.Read'],
      account: this.account,
    };

    try {
      const authSilentResult = await this.instance.acquireTokenSilent(request);
      return authSilentResult.accessToken;
    } catch (error) {
      // if acquiring the token silently fails, then present the user with the popup to get the token
      if (error instanceof InteractionRequiredAuthError) {
        const authInteractiveResult = await this.instance.acquireTokenPopup(request);
        return authInteractiveResult.accessToken;
      } else {
        throw error;
      }
    }
  };

  /**
   * Constructs options object for fetch request
   * @param headers Headers
   * @param accessToken string
   * @returns options: {
      method: string;
      headers: Headers;
    }
   */
  private constructOptions = (headers: Headers, accessToken: string) => {
    const bearer = `Bearer ${accessToken}`;
    headers.append('Authorization', bearer);

    const options = {
      method: 'GET',
      headers,
    };

    return options;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validateResponseStatus = (response: Response, responseJson: any) => {
    if (response.status >= 400) {
      const apiErrorResponse = {
        status: response.status,
        message: responseJson?.error?.message,
      };

      throw new MsGraphApiError(apiErrorResponse);
    }
  };

  /**
   * This function calls the Get organization endpoint to get the organization displayName
   * @returns Promise<string>
   */
  getOrganizationDisplayName = async (): Promise<string> => {
    const endpoint = `${this.baseUrl}${this.tenantId}?$select=displayName`;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const accessToken = await this.getAccessToken();
    const options = this.constructOptions(headers, accessToken);

    const res = await fetch(endpoint, options);
    const resJson = await res.json();
    this.validateResponseStatus(res, resJson);

    return resJson.displayName;
  };

  /**
   * This function calls the Get organizationalBranding endpoint to get the organization logo
   * @returns Promise<string>
   */
  getOrganizationLogo = async (): Promise<string> => {
    const endpoint = `${this.baseUrl}${this.tenantId}/branding?$select=cdnList,faviconRelativeUrl,squareLogoRelativeUrl`;
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    // Required additional header, passing in 0 returns the default organizational branding object
    headers.append('Accept-Language', '0');

    const accessToken = await this.getAccessToken();
    const options = this.constructOptions(headers, accessToken);

    const res = await fetch(endpoint, options);
    const resJson = await res.json();
    this.validateResponseStatus(res, resJson);

    return this.constructImageUrl(resJson);
  };

  /**
   * Constructs the logo image URL from the organizationalBranding API response
   * @returns string
   */
  private constructImageUrl = (response: OrganizationalBrandingSuccessResponse): string => {
    const { faviconRelativeUrl, squareLogoRelativeUrl, cdnList } = response;
    // A list of base URLs for all available CDN providers that are serving the assets of the current resource, just using the first one in the list
    const cdn = cdnList[0];
    const baseUrl = `https://${cdn}/`;

    // Priority of logos: square logo, then favicon, then fallback to no logo
    if (squareLogoRelativeUrl) return `${baseUrl}${squareLogoRelativeUrl}`;
    if (faviconRelativeUrl) return `${baseUrl}${faviconRelativeUrl}`;
    return '';
  };
}

export default MsGraph;
