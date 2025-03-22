import axios from 'axios';
import querystring from 'querystring';

export async function getRequest<T>(url: string, token: string) {
    const response = await axios.get<T>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  
    return response
}

export async function postRequest<T>(url: string, querystringParams?: {}, headers?: {}) {
    const response = await axios.post<T>(
        url,
        querystring.stringify(querystringParams),
        { headers }
    );

    return response;
}