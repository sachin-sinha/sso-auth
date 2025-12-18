export const IdentityProvider = {
  Okta: 'okta',
  MSEntra: 'ms_entra',
  Other: 'other'
} as const;
export type IdentityProvider = (typeof IdentityProvider)[keyof typeof IdentityProvider];

export type SupportedProviders = typeof IdentityProvider.Okta | typeof IdentityProvider.MSEntra;

export type OrganizationPreference = {
  timezone?: string;
};

export type SAMLConfig = {
  idP: IdentityProvider;
  entryPoint: string;
  logoutURL?: string;
  entityId: string;
  issuer: string;
  certificate: string;
  callbackURL: string;
  isActive: boolean;
  metadata: SAMLConfigMetadata;
};

export type SAMLAttributeKeyMapping = Record<'email' | 'first_name' | 'last_name', string>;

export type SAMLConfigMetadata = {
  nameIdFormat: string;
  attributes: SAMLAttributeKeyMapping;
};

export interface Organization {
  id: string;
  name: string;
  ssoEnabled: boolean;
  domain?: string;
  scimToken?: string;
  samlConfig?: SAMLConfig;
  preferences?: OrganizationPreference;
}

export interface Integration {
  provider: string;
  credentials: { client_id: string; client_secret: string };
}

export interface AccountInfo {
  owner?: string;
  organization?: Organization;
  integrations?: Integration[];
}
