export const serviceProviderConfig = {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  documentationUri: 'https://your-domain.com/docs/scim',
  patch: {
    supported: true
  },
  bulk: {
    supported: false
  },
  filter: {
    supported: true,
    maxResults: 1000
  },
  changePassword: {
    supported: false
  },
  sort: {
    supported: false
  },
  etag: {
    supported: false
  },
  authenticationSchemes: [
    {
      name: 'OAuth Bearer Token',
      description: 'Authentication via OAuth 2.0 Bearer Token',
      specUri: 'https://tools.ietf.org/html/draft-ietf-oauth-v2-bearer',
      type: 'oauthbearertoken',
      primary: true
    }
  ],
  meta: {
    location: 'https://your-domain.com/api/scim/v2/ServiceProviderConfig',
    resourceType: 'ServiceProviderConfig',
    created: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
    version: 'W/"1"'
  }
};

export const userSchema = {
  id: 'urn:ietf:params:scim:schemas:core:2.0:User',
  name: 'User',
  description: 'User Account',
  specUri: 'https://tools.ietf.org/html/rfc7643#section-4.1',
  attributes: [
    {
      name: 'userName',
      type: 'string',
      multiValued: false,
      description: 'Unique identifier for the User. Usually an email.',
      required: true,
      caseExact: false,
      mutability: 'readWrite',
      returned: 'default',
      uniqueness: 'server'
    },
    {
      name: 'externalId',
      type: 'string',
      multiValued: false,
      description: 'External unique identifier of the User.',
      required: false,
      caseExact: false,
      mutability: 'readWrite',
      returned: 'default',
      uniqueness: 'none'
    },
    {
      name: 'name',
      type: 'complex',
      multiValued: false,
      description: "The components of the user's real name.",
      required: false,
      mutability: 'readWrite',
      returned: 'default',
      subAttributes: [
        {
          name: 'givenName',
          type: 'string',
          multiValued: false,
          description: 'The given name of the user.',
          required: false,
          caseExact: false,
          mutability: 'readWrite',
          returned: 'default',
          uniqueness: 'none'
        },
        {
          name: 'familyName',
          type: 'string',
          multiValued: false,
          description: 'The family name of the user.',
          required: false,
          caseExact: false,
          mutability: 'readWrite',
          returned: 'default',
          uniqueness: 'none'
        }
      ]
    },
    {
      name: 'emails',
      type: 'complex',
      multiValued: true,
      description: 'Email addresses for the user.',
      required: false,
      mutability: 'readWrite',
      returned: 'default',
      subAttributes: [
        {
          name: 'value',
          type: 'string',
          multiValued: false,
          description: 'Email address value.',
          required: false,
          caseExact: false,
          mutability: 'readWrite',
          returned: 'default',
          uniqueness: 'none'
        },
        {
          name: 'type',
          type: 'string',
          multiValued: false,
          description: 'A label indicating the attribute\'s function; e.g., "work" or "home".',
          required: false,
          caseExact: false,
          canonicalValues: ['work', 'home', 'other'],
          mutability: 'readWrite',
          returned: 'default',
          uniqueness: 'none'
        },
        {
          name: 'primary',
          type: 'boolean',
          multiValued: false,
          description: 'A boolean value indicating the primary email.',
          required: false,
          mutability: 'readWrite',
          returned: 'default',
          uniqueness: 'none'
        }
      ]
    },
    {
      name: 'active',
      type: 'boolean',
      multiValued: false,
      description: "A boolean value indicating the User's administrative status.",
      required: false,
      mutability: 'readWrite',
      returned: 'default',
      uniqueness: 'none'
    },
    {
      name: 'id',
      type: 'string',
      multiValued: false,
      description: 'A unique identifier for the User.',
      required: false,
      caseExact: true,
      mutability: 'readOnly',
      returned: 'always',
      uniqueness: 'global'
    },
    {
      name: 'meta',
      type: 'complex',
      multiValued: false,
      description: 'A complex attribute containing resource metadata.',
      required: false,
      mutability: 'readOnly',
      returned: 'default',
      subAttributes: [
        {
          name: 'resourceType',
          type: 'string',
          multiValued: false,
          description: 'Name of the resource type.',
          required: false,
          caseExact: true,
          mutability: 'readOnly',
          returned: 'default',
          uniqueness: 'none'
        },
        {
          name: 'created',
          type: 'dateTime',
          multiValued: false,
          description: 'The time the resource was created.',
          required: false,
          mutability: 'readOnly',
          returned: 'default',
          uniqueness: 'none'
        },
        {
          name: 'lastModified',
          type: 'dateTime',
          multiValued: false,
          description: 'The most recent time the resource was modified.',
          required: false,
          mutability: 'readOnly',
          returned: 'default',
          uniqueness: 'none'
        }
      ]
    }
  ],
  meta: {
    resourceType: 'Schema',
    location: 'https://your-domain.com/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User'
  }
};

// /api/scim/v2/Schemas
export const schemasResponse = {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  totalResults: 1,
  startIndex: 1,
  itemsPerPage: 1,
  Resources: [userSchema]
};
