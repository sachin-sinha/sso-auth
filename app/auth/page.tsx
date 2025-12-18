'use client';

import SSOLoginForm from '@/components/auth/sso';

export default function page() {
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-md'>
        <SSOLoginForm />
      </div>
    </div>
  );
}
