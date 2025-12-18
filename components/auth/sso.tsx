'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';
import { APIResponse } from '@/lib/utils/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SSOLoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    access_url: ''
  });
  const router = useRouter();

  // handles SSO email check and initiate SSO SAML flow
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { email } = formData;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/auth/saml/lookup?email=${email}`);
      const resData = (await res.json()) as APIResponse;

      if (!res.ok || res.status !== 200 || !resData.success) {
        if (resData.error) {
          return toast.error(resData.error);
        }

        return toast.error(`Failed to lookup organization by domain, response data: ${resData}`);
      }

      const ssoURL = (resData.data?.['ssoURL'] || '') as string;

      if (!ssoURL) throw new Error('Invalid or missing sso url');
      router.push(ssoURL);
    } catch (error) {
      console.error('error logging in', error);
      toast.error(`Failed to log in via SSO`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0'>
          <form className='p-8 md:p-10' onSubmit={onSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center gap-3 mb-6'>
                <Image width={42} height={40} alt='BangDB icon' src={'/bangdb-icon.png'} className='h-fit' />
                <div>
                  <h1 className='text-2xl text-gray-800'>BangDB - SSO Login </h1>
                </div>
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                  id='email'
                  type='text'
                  placeholder='Enter your email address'
                  required
                  className='w-full py-5'
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <Button type='submit' className='w-full cursor-pointer' loading={isSubmitting}>
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
        By clicking continue, you agree to our{' '}
        <Link href='https://bangdb.com/terms-and-conditions' target='_blank'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href='https://bangdb.com/privacy-policy' target='_blank'>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
