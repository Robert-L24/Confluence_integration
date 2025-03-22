import { ConfluenceTokenResponse, GetAccessTokenResponse } from '../common/types';
import { postRequest } from '../common/apiWrapper';


export class Authenticator {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokenUrl: string;
  private authEndpoint: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string, tokenUrl: string, authEndpoint: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.tokenUrl = tokenUrl;
    this.authEndpoint = authEndpoint;
  }

  public generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.clientId,
      scope: 'read:page:confluence read:space:confluence',
      redirect_uri: this.redirectUri,
      state: state,
      response_type: 'code',
      prompt: 'consent'
    });
    return `${this.authEndpoint}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<GetAccessTokenResponse> {
    const data = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await postRequest<ConfluenceTokenResponse>(this.tokenUrl, data, headers);

    return { accessToken: response.data.access_token, expiresInSec: response.data.expires_in };
  }
}
