import { SpacesResponse, GetPageByIdResponse } from '../common/types';
import { getRequest } from '../common/apiWrapper';

export async function getAllPagesInSpace(spaceKey: string, cloudId: string, token: string): Promise<SpacesResponse> {
  const spaceID = await getSpaceIdByKey(spaceKey, cloudId, token);
  const confluenceApiUrl = process.env.CONFLUENCE_API_URL;
  try {
    const response = await getRequest<SpacesResponse>(`${confluenceApiUrl}/${cloudId}/wiki/api/v2/spaces/${spaceID}/pages`, token);
    return response.data;
  } catch (error) {
    console.error("Error calling Confluence API:", error);
    throw error;
  }
}

export async function getPageById(pageId: string, cloudId: string, token: string): Promise<GetPageByIdResponse> {
  interface ResponseData {
    title: string;
    body: {view: {value: string}};
  }
  
  const confluenceApiUrl = process.env.CONFLUENCE_API_URL;

  try {
    const response = 
      await getRequest<ResponseData>(`${confluenceApiUrl}/${cloudId}/wiki/api/v2/pages/${pageId}?body-format=view`, token);

    return {
      title: response.data?.title,
      body: response.data?.body?.view?.value
    };
  } catch (error) {
    console.error("Error calling Confluence API:", error);
    throw error;
  }  
}

async function getSpaceIdByKey(spaceKey: string, cloudId: string, token: string): Promise<number> {
  type ConfluenceSpaceResponse = {
    results: {
      id: number;
      key: string;
    }[]
  };
  
  const confluenceApiUrl = process.env.CONFLUENCE_API_URL;
  
  try {
    const response = 
      await getRequest<ConfluenceSpaceResponse>(`${confluenceApiUrl}/${cloudId}/wiki/api/v2/spaces?keys=${spaceKey}`, token);
    
    return response.data?.results?.[0]?.id;
  } catch (error) {
    console.error("Error calling Confluence API:", error);
    throw error;
  }
}

export async function getCloudId(token: string) {
  interface ResponseItem {
    id: string;
  }

  const cloudIdUrl = process.env.CLOUD_ID_URL || '';
  try {
    const response = await getRequest<ResponseItem[]>(cloudIdUrl, token);
    return response.data[0].id;
  } catch (error) {
    console.error("Error calling Confluence API:", error);
    throw error;
  }

}
