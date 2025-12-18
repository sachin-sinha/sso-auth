'use server';

import { cookies } from 'next/headers';

export const setCookie = async (name: string, value: string, maxAge: number | undefined = undefined) => {
  const cookieStore = await cookies();

  cookieStore.set({
    name,
    value,
    httpOnly: true,
    secure: true,
    maxAge
  });
};

export const getCookie = async (name: string) => {
  const cookieStore = await cookies();
  const value = cookieStore.get(name);

  return value;
};

export const getAllCookies = async () => {
  const cookieStore = await cookies();
  return cookieStore.getAll();
};

export const cookieExists = async (name: string) => {
  const cookieStore = await cookies();
  const hasCookie = cookieStore.has(name);

  return hasCookie;
};

export const deleteCookie = async (name: string, option: 0 | 1 = 0) => {
  if (option === 0) {
    await setCookie(name, '');
  } else if (option === 1) {
    (await cookies()).delete(name);
  }
};
