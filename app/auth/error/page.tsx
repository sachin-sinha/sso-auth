import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import Image from 'next/image';

import { cn } from '@/lib/utils';
import Link from 'next/link';

export default async function page({
  searchParams
}: {
  searchParams: Promise<{ [msg: string]: string | undefined; redirectURL: string | undefined }>;
}) {
  const params = await searchParams;
  const msg = params?.msg || 'An unknown error occurred during SSO authentication. Please try again.';

  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-md'>
        <div className={cn('flex flex-col gap-6')}>
          <Card className='overflow-hidden p-0'>
            <CardContent className='grid p-0'>
              <div className='p-8 md:p-10'>
                <div className='flex flex-col gap-6 items-center'>
                  <div className='flex flex-col items-center gap-3 mb-6'>
                    <Image
                      width={42}
                      height={40}
                      alt='BangDB icon'
                      src={'/bangdb-icon.png'}
                      className='h-fit'
                    />
                    <div>
                      <h1 className='text-2xl text-gray-800'>BangDB - SSO Login </h1>
                    </div>
                  </div>

                  <p className='text-center text-rose-600 '>{msg}</p>

                  <div className='flex flex-col items-center gap-y-2.5 mt-3'>
                    {params.redirectURL && (
                      <Link href={params.redirectURL} target='_blank' rel='noopener noreferrer'>
                        <Button variant='outline'>Go back to App</Button>
                      </Link>
                    )}
                    <Link href='/auth'>
                      <Button variant='link'>Go back to SSO Login</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
