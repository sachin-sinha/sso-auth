export function getHashCode(s: string) {
  const c = s.length || 0;
  let hash = 0,
    i = 0;

  while (i < c) {
    hash = (hash << 5) - hash + s.charCodeAt(i++);
  }

  return hash < 0 ? hash * -1 + 0xffffffff : hash; /* convert to unsigned int */
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authTokenPayload = (payload: any) => {
  const refer = `bvector-web-client`;
  const ts = (Date.now() * 1000)?.toString();
  const secret = process.env.NEXT_PUBLIC_TOKEN_AUTH_SECRET;

  return {
    ...payload,
    refer,
    ts,
    token: getHashCode(refer + ts + secret)
  };
};
