import { schemasResponse } from '@/lib/schemas/scim';
import { formatScimError } from '@/lib/scim';
import { NextResponse } from 'next/server';

// No auth required - this is metadata about SCIM schemas

/**
 *   GET /api/scim/v2/Schemas
 */
export async function GET() {
  try {
    return NextResponse.json(schemasResponse, { status: 200 });
  } catch (error) {
    console.error('ServiceProviderConfig error:', error);
    return formatScimError(500, 'Internal server error');
  }
}
