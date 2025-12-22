'use server';

import { cookies } from 'next/headers';

export const setCookie = async ({
  name,
  value,
  maxAge,
  domain = '.bangdb.com'
}: {
  name: string;
  value: string;
  maxAge?: number | undefined;
  domain?: string;
}) => {
  const cookieStore = await cookies();

  cookieStore.set({
    name,
    value,
    domain,
    httpOnly: true,
    secure: true,
    maxAge
  });
};

export const getCookie = async (name: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(name);
};

export const getAllCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll();
};

export const cookieExists = async (name: string) => {
  const cookieStore = await cookies();
  return cookieStore.has(name);
};

export const deleteCookie = async (name: string, option: 0 | 1 = 0) => {
  if (option === 0) {
    await setCookie({ name, value: '' });
  } else if (option === 1) {
    (await cookies()).delete(name);
  }
};
