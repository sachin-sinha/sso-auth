import { NextResponse } from 'next/server';

export type APIResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, unknown> | null;
};

const SuccessRes = (msg: string, data: APIResponse['data'] = null, status = 200) => {
  return NextResponse.json<APIResponse>({ success: true, message: msg, data }, { status });
};

const ErrorRes = (status: number, msg: string) => {
  return NextResponse.json<APIResponse>({ success: false, error: msg }, { status });
};

export const api = {
  SuccessRes,
  ErrorRes
};
