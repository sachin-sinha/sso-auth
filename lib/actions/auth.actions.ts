/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserServiceAPI } from '@/lib/userservice.sdk';
import { authTokenPayload } from '@/lib/actions/verifications.actions';

import axios, { AxiosInstance } from 'axios';
import { DynamicObjectType, normalizeEndpoint } from '../../jsclient/utils';

const handleAxiosError = (error: unknown) => {
  console.error(JSON.stringify(error));

  // @ts-expect-error - Error will contain these things
  if (error.response) {
    // @ts-expect-error - Error will contain these things
    return error.response;
  } else {
    // @ts-expect-error - Error will contain these things
    return error.message;
  }
};

export const authenticateUser = async (payload: any) => {
  try {
    const { data: response } = await UserServiceAPI.post('/user/authenticate_user', payload);

    return response;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const getUserInfo = async (payload: any) => {
  try {
    const { data: response } = await UserServiceAPI.post('/user/info', payload);

    return response;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const userSessions = async (payload: any) => {
  try {
    const { data: response } = await UserServiceAPI.post('/user/ext_session', payload);

    return response;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const updateUserInfo = async (payload: any) => {
  try {
    return await UserServiceAPI.post('/user/update', payload).then(res => res?.data);
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const addServerInfo = async (payload: any) => {
  try {
    return await UserServiceAPI.post('/user/add_server_info', payload).then(res => res?.data);
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const createUser = async (payload: any) => {
  try {
    const res = await UserServiceAPI.post('/user/create', payload);
    return res.data;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const createApiKey = async (payload: any) => {
  try {
    const res = await UserServiceAPI.post('/user/create_api_key', payload);
    return res.data;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const getAccountUsers = async (json: any) => {
  const res = await UserServiceAPI.post('/user/get_users', json);
  return res.data;
};

export const getAccountInfo = async (payload: any) => {
  const res = await UserServiceAPI.post('/user/get_account_info', payload);

  return res.data;
};

export const updateAccountInfo = async (payload: any) => {
  try {
    return await UserServiceAPI.post('/user/add_account_info', payload).then(res => res?.data);
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const deleteAccount = async (payload: any) => {
  const res = await UserServiceAPI.post('/user/delete_account', payload);
  return res.data;
};

export interface UserServiceClientArgs {
  /** The base url of the BangDB server */
  baseUrl?: string;
}

export class UserServiceClient {
  private readonly _configOptions: {
    baseUrl: string;
    headers: Record<string, string>;
  };

  private _apiInstance: AxiosInstance;

  /**
   * Creates a new BVector instance.
   * @param args - Configuration options for the client
   */
  constructor(args: UserServiceClientArgs) {
    const { baseUrl } = args;

    if (!baseUrl) {
      throw new Error('Please provide a baseUrl');
    }

    const url = `https://${baseUrl}`;

    const configOptions = {
      baseUrl: url,
      headers: {
        'x-bang-api-src': 'ampere'
      }
    };

    const instance = axios.create({
      baseURL: configOptions.baseUrl,
      headers: configOptions.headers,
      timeout: 30000
    });

    this._configOptions = configOptions;
    this._apiInstance = instance;
  }

  private async get(endpoint: string, params: any = {}) {
    /**
     * Makes a GET request to the API.
     * @param endpoint - API endpoint (relative to the base URL).
     * @param params - Optional query parameters.
     * @returns JSON response from the API.
     */

    const url = normalizeEndpoint(endpoint);

    try {
      const { data: response } = await this._apiInstance.get(url, { params });
      return response;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        return error.message;
      }
    }
  }

  private async post(endpoint: string, payload: DynamicObjectType = {}, headers?: Record<string, string>) {
    /**
     * Makes a POST request to the API.
     * @param endpoint - API endpoint (relative to the base URL).
     * @param payload - JSON payload for the POST request.
     * @param headers - Optional additional headers.
     * @returns JSON response from the API.
     */

    const url = normalizeEndpoint(endpoint);

    try {
      const { data: response } = await this._apiInstance.post(url, payload, {
        headers
      });

      return response;
    } catch (error: any) {
      if (error.response) {
        return error.response;
      } else {
        return error.message;
      }
    }
  }

  public async createUser(payload: any) {
    try {
      const res = await this.post('/user/create', payload);
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  public async createApiKey(payload: any) {
    try {
      const res = await this.post('/user/create_api_key', payload);
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  public async getAccountUsers(json: any) {
    const res = await this.post('/user/get_users', json);
    return res;
  }

  public async getUserInfo(payload: any) {
    try {
      const res = await this.post('/user/info', payload);
      return res;
    } catch (error) {
      return handleAxiosError(error);
    }
  }

  public async deleteUser({ userid }: { userid: string }) {
    const res = await this.post('/user/delete', authTokenPayload({ userid }));

    return res;
  }

  public async authenticateUser(payload: any) {
    const res = await this.post('/user/authenticate_user', payload);

    return res;
  }

  public async addServerInfo(payload: any) {
    const res = await this.post('/user/add_server_info', payload);

    return res;
  }

  public async changePassword(payload: any) {
    return await this.post('/user/change_pwd', payload);
  }
}
