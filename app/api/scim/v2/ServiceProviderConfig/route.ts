import { serviceProviderConfig } from '@/lib/schemas/scim';
import { formatScimError } from '@/lib/scim';
import { NextResponse } from 'next/server';

// No auth required - this is metadata about what the server supports
/**
 *   GET scim/v2/ServiceProviderConfig
 */
export async function GET() {
  try {
    return NextResponse.json(serviceProviderConfig, { status: 200 });
  } catch (error) {
    console.error('ServiceProviderConfig error:', error);
    return formatScimError(500, 'Internal server error');
  }
}
