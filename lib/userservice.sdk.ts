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
  const baseURLWithProtocol = `https://${baseURL}`;

  UserServiceAPI.defaults.baseURL = baseURLWithProtocol;
  UserServiceBaseURL = baseURL;

  await setCookie('bdb_us', JSON.stringify({ baseURL }));

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
