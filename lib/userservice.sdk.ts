import axios from 'axios';
import { setCookie } from '@/lib/actions/cookie.actions';

export let UserServiceBaseURL = process.env.NEXT_PUBLIC_USER_API;

console.log('🚀 ~ UserServiceBaseURL:', UserServiceBaseURL);

export let UserServiceAPI = axios.create({
  baseURL: `https://${UserServiceBaseURL}`,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'x-bang-api-src': 'ampere'
  }
});

export const setUserService = async ({
  baseURL,
  returnValues
}: {
  baseURL: string;
  returnValues?: boolean;
}) => {
  UserServiceAPI.defaults.baseURL = `https://${baseURL}`;
  UserServiceBaseURL = baseURL;

  await setCookie({ name: 'bdb_us', value: JSON.stringify({ baseURL }) });
  if (returnValues) return { baseURL };
};

export const resetUserServiceAPI = () => {
  UserServiceBaseURL = process.env.NEXT_PUBLIC_USER_API;

  UserServiceAPI = axios.create({
    baseURL: `https://${UserServiceBaseURL}`,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'x-bang-api-src': 'ampere'
    }
  });
};
