/** Default configuration for Bvector Client connections */
export const defaultClientArgs = {
  database: 'mydb',
  port: 18080,
  ssl: false
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DynamicObjectType = { [key: string]: any };

export const normalizeEndpoint = (endpoint: string) => {
  if (endpoint.startsWith('/')) {
    return endpoint.slice(1); // removes the first character
  }

  return endpoint;
};
