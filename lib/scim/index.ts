import { User, UserStatus } from '@/types/user';
import { NextResponse } from 'next/server';
import { compileFilter } from 'scim-query-filter-parser';
import { z } from 'zod';

//*=== Types & Schemas

export type ScimOperation = 'Replace' | 'Add' | 'Remove';

export interface ScimPatchOperation {
  op: ScimOperation;
  path: string;
  value?: unknown;
}

export interface ScimPatchRequest {
  schemas: string[];
  Operations: ScimPatchOperation[];
}

export interface ScimUser {
  schemas: string[];
  id: string;
  externalId: string;
  userName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{
    value: string;
    type: string;
    primary: boolean;
  }>;
  active: boolean;
  meta: {
    resourceType: string;
    created: string;
    lastModified: string;
  };
}

export interface ScimError {
  schemas: string[];
  detail: string;
  status: number;
}

export interface ScimListResponse {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: ScimUser[];
}

// Zod Schemas for Validation
const scimOperationSchema = z.object({
  op: z.enum(['Replace', 'Add', 'Remove']),
  path: z.string(),
  value: z.unknown().optional()
});

const scimPatchRequestSchema = z.object({
  schemas: z.array(z.string()),
  Operations: z.array(scimOperationSchema)
});

//*=== Filter parser
/**
 * Parse filter query param
 */
export function parseFilterQuery(filterParam?: string) {
  if (!filterParam) return null;
  try {
    return compileFilter(filterParam);
  } catch (error) {
    throw new Error(`Invalid SCIM filter: ${(error as Error).message}`);
  }
}

//*=== Field Mapping

/**
 * Normalize SCIM paths to handle variations between IdPs (Okta, Entra, others)
 */
const normalizeScimPath = (path: string): string => {
  const pathMap: Record<string, string> = {
    // Standard SCIM paths (Okta)
    'name.givenName': 'givenName',
    'name.familyName': 'familyName',

    // Entra variations
    displayName: 'displayName',
    'name.formatted': 'displayName',

    // Non-standard variations (defensive)
    givenName: 'givenName',
    firstName: 'givenName',
    familyName: 'familyName',
    lastName: 'familyName',

    // Email variations
    'emails[type eq "work"].value': 'email',
    'emails[primary eq true].value': 'email',
    email: 'email',

    // Active status
    active: 'active',

    // ExternalId
    externalId: 'externalId',

    // UserName (some IdPs send this)
    userName: 'userName'
  };

  return pathMap[path] || path;
};

/**
 * Maps normalized SCIM field to internal User field
 */
const scimFieldToUserField = (normalizedField: string): string | null => {
  const fieldMap: Record<string, string> = {
    givenName: 'first_name',
    familyName: 'last_name',
    displayName: 'displayName', // Will be parsed separately
    email: 'email',
    active: 'status',
    userName: 'email',
    externalId: 'externalId'
  };

  return fieldMap[normalizedField] || null;
};

/**
 * Convert SCIM PATCH operations to update object for your DB
 * Handles: Replace, Add (both update), Remove operations
 * Supports multiple IdP formats (Okta, Entra, others)
 */
export function applyPatchOperations(operations: ScimPatchOperation[]): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  for (const op of operations) {
    // Handle Replace and Add operations (both update the field)
    if (op.op !== 'Replace' && op.op !== 'Add') {
      // Skip Remove for now, can add later if needed
      continue;
    }

    const normalized = normalizeScimPath(op.path);
    const userField = scimFieldToUserField(normalized);

    if (!userField) {
      // Unknown field, skip
      continue;
    }

    // Special handling for displayName/name.formatted (Entra format)
    if (userField === 'displayName' && op.value) {
      const { first_name, last_name } = parseFullName(op.value as string);
      updateData.first_name = first_name;
      updateData.last_name = last_name;
    }
    // Type conversions based on a field
    else if (userField === 'status') {
      // active (boolean) -> status (string)
      updateData[userField] = op.value === true ? 'active' : 'deleted';
    } else {
      updateData[userField] = op.value;
    }
  }

  return updateData;
}

/**
 * Parse full name (displayName, name.formatted) into firstName/lastName
 */
export function parseFullName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  if (!fullName || typeof fullName !== 'string') {
    return { first_name: '', last_name: '' };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { first_name: '', last_name: '' };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }

  // Last element is lastName, everything else is firstName
  const first_name = parts.slice(0, -1).join(' ');
  const last_name = parts[parts.length - 1];

  return { first_name, last_name };
}

/**
 * Convert internal User object to SCIM format
 */
export function userToScimFormat(user: User, scimId: string): Omit<ScimUser, 'schemas' | 'meta'> {
  return {
    id: scimId,
    externalId: user.email,
    userName: user.email,
    name: {
      givenName: user.first_name || '',
      familyName: user.last_name || ''
    },
    emails: [
      {
        value: user.email,
        type: 'work',
        primary: true
      }
    ],
    active: user.status === UserStatus.ACTIVE
  };
}

//*=== Validations

/**
 * Validate incoming SCIM PATCH request
 */
export function validatePatchRequest(body: unknown): ScimPatchRequest {
  try {
    return scimPatchRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const fieldPath = firstIssue.path.join('.');
      throw new Error(
        `Invalid SCIM PATCH request: ${fieldPath ? `${fieldPath} - ` : ''}${firstIssue.message}`
      );
    }
    throw error;
  }
}

/**
 * Validate that operations contain at least one valid operation
 */
export function validateOperations(operations: ScimPatchOperation[]): void {
  if (!operations || operations.length === 0) {
    throw new Error('Operations array is required and must not be empty');
  }

  for (const op of operations) {
    if (!op.path) {
      throw new Error('Operation path is required');
    }

    if (op.op === 'Replace' && op.value === undefined) {
      throw new Error('Replace operation requires a value');
    }
  }
}

//*=== Response Formatters

/**
 * Format a User object as SCIM User resource
 */
export function formatScimUser(user: User, scimId: string): ScimUser {
  const baseUser = userToScimFormat(user, scimId);

  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    ...baseUser,
    meta: {
      resourceType: 'User',
      created:
        // user.created_at
        // ? new Date(user.created_at).toISOString()
        // :
        new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
}

/**
 * Format SCIM error response
 */
export function formatScimError(status: number, detail: string): NextResponse {
  return NextResponse.json<ScimError>(
    {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
      detail,
      status
    },
    { status }
  );
}

/**
 * Format SCIM list response (for GET /Users)
 */
export function formatScimListResponse(users: User[], scimIds: string[]): ScimListResponse {
  return {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
    totalResults: users.length,
    startIndex: 1,
    itemsPerPage: users.length,
    Resources: users?.map((user, idx) => formatScimUser(user, scimIds[idx]) || [])
  };
}

//*=== Other Helpers

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
