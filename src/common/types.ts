export interface GetPageByIdResponse {
    title: string;
    body: string;
};

export interface SpacesResponse {
    results: any[];
  };

export interface ConfluenceTokenResponse {
access_token: string;
expires_in: number;
}
  
export interface GetAccessTokenResponse {
  accessToken: string;
  expiresInSec: number;
  }
    
  