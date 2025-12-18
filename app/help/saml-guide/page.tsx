'use client';

import { JSX, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OktaIcon, MSIcon } from '@/components/assets/icons';
import GuideContentsNav from '@/components/help-guides/guide-contents';
import { SupportedProviders } from '@/types/organization';

const BangDBConfig = {
  saml: {
    callbackUrl: 'https://app.bangdb.com/api/auth/saml/callback',
    entityId: 'https://bangdb.com'
  },
  scim: {
    baseUrl: 'https://api.bangdb.com/api/scim/v2/'
  }
};

const ProviderConfig: Record<
  SupportedProviders,
  {
    name: string;
    icon: JSX.Element;
    metadataSteps: string[];
    scimSteps: string[];
    metadataExample: string;
  }
> = {
  okta: {
    name: 'Okta',
    icon: OktaIcon,
    metadataSteps: [
      'Sign in to your Okta Admin Console',
      'Navigate to Applications > Applications',
      'Find your SAML application',
      'Click on the app name to open its settings',
      'Go to the Sign On tab',
      'Under SAML 2.0 configuration, click Identity Provider metadata link',
      'Copy the URL from your browser address bar'
    ],
    scimSteps: [
      'In your Okta Admin Console, go to Applications > Applications',
      'Select your SAML application',
      'Click on the Provisioning tab',
      'Click Edit in the Provisioning Connection section',
      'Enter the SCIM Base URL provided by BangDB',
      'Select HTTP Header as the Authentication method',
      'Enter the Bearer token in the Authorization Header field',
      'Click Test Connection to verify',
      'Click Save'
    ],
    metadataExample: 'https://your-domain.okta.com/app/123abc/sso/saml/metadata'
  },
  ms_entra: {
    name: 'Microsoft Entra ID',
    icon: MSIcon,
    metadataSteps: [
      'Sign in to the Microsoft Entra admin center',
      'Navigate to Enterprise applications',
      'Select your SAML application',
      'Click on Single sign-on in the left sidebar',
      'In the SAML-based sign-on section, look for App Federation Metadata URL',
      'Copy the URL'
    ],
    scimSteps: [
      'In Microsoft Entra admin center, go to Enterprise applications',
      'Select your SAML application',
      'Click Provisioning in the left sidebar',
      'Set Provisioning Status to On',
      'Click Edit Provisioning in the Admin Credentials section',
      'Enter the SCIM Base URL provided by BangDB in the Tenant URL field',
      'Enter the Bearer token in the Secret Token field',
      'Click Test Connection to verify',
      'Click Save'
    ],
    metadataExample:
      'https://login.microsoftonline.com/your-tenant-id/federationmetadata/2007-06/federationmetadata.xml'
  }
};

/**
 * /app/help/saml-guide
 */
export default function SSOGuide() {
  const [provider, setProvider] = useState<SupportedProviders>('okta');

  const config = ProviderConfig[provider];
  const IconComponent = config.icon;

  return (
    <div className='min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-8 px-2'>
      <div className='max-w-6xl mx-auto flex gap-6'>
        <GuideContentsNav provider={provider} setProvider={setProvider} />
        <div className='flex-1 min-w-0 max-w-4xl'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-semibold text-slate-800 dark:text-gray-50 mb-2'>
              SSO & SCIM Setup Guide
            </h1>
            <p className='text-base text-slate-600 dark:text-slate-400'>
              Enable Single Sign-On and automated user provisioning for your BangDB organization
            </p>
          </div>

          {/* Provider Selection */}
          <Card className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='text-lg'>Select Your Identity Provider</CardTitle>
              <CardDescription>Choose your SSO provider to view specific setup instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={provider} onValueChange={value => setProvider(value as SupportedProviders)}>
                <div className='flex items-center space-x-8'>
                  {['okta', 'ms_entra'].map(value => {
                    const isSelected = value === provider;
                    const name = value === 'okta' ? 'Okta' : 'Microsoft Entra ID';
                    return (
                      <div key={value} className='flex items-center space-x-2'>
                        <RadioGroupItem value={value} id={value} />
                        <label htmlFor={value} className='flex items-center space-x-2 cursor-pointer'>
                          <div className='w-5 h-5 text-slate-700 dark:text-slate-300'>
                            {value === 'okta' ? OktaIcon : MSIcon}
                          </div>
                          <span
                            className={`font-medium ${
                              isSelected
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {name}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Overview */}
          <Card id='overview' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle>What is SSO & SCIM?</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Single Sign-On (SAML)</h3>
                <p className='text-slate-600 dark:text-slate-400'>
                  SAML allows your team members to log in to BangDB using their existing organization
                  credentials via an Identity Provider. No need to manage separate passwords.
                </p>
              </div>
              <div>
                <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>SCIM (Optional)</h3>
                <p className='text-slate-600 dark:text-slate-400'>
                  System for Cross-domain Identity Management automatically provisions and de-provisions
                  users. When you remove someone from your identity provider, they`re automatically removed
                  from BangDB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card id='prerequisites' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-3'>
                <li className='flex items-start space-x-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                  <span className='text-slate-700 dark:text-slate-300'>
                    <strong>{config.name} Admin Access:</strong> You need admin access to your identity
                    provider to configure SAML
                  </span>
                </li>
                <li className='flex items-start space-x-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                  <span className='text-slate-700 dark:text-slate-300'>
                    <strong>BangDB Admin Access:</strong> You need organization admin permissions in BangDB
                  </span>
                </li>
                <li className='flex items-start space-x-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0' />
                  <span className='text-slate-700 dark:text-slate-300'>
                    <strong>Email Domain:</strong> A email domain added to your BangDB organization.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Create SAML App in Provider */}
          <Card id='create-app' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2 text-lg'>
                <div className='w-5 h-5'>{IconComponent}</div>
                <span>Create SAML Application in {config.name}</span>
              </CardTitle>
              <CardDescription>First, create a SAML application in your identity provider</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {provider === 'okta' && (
                <div className='space-y-6'>
                  <Alert className='mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 w-fit'>
                    <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                    <AlertDescription className='text-amber-800 dark:text-amber-300 inline pr-2'>
                      <strong>Important:</strong> Select <strong>SAML 2.0</strong> when choosing the app type.
                    </AlertDescription>
                  </Alert>

                  <div className='space-y-4'>
                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        1
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Sign in to your Okta Admin Console
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        2
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Navigate to <strong>Applications → Applications</strong>
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        3
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Click <strong>Create App Integration</strong>
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        4
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          Select <strong>SAML 2.0</strong> as the Sign-in method
                        </p>
                        <Image
                          src='/images/guides/okta-create-app-1.webp'
                          alt='Okta app type selection showing SAML 2.0 option'
                          width={600}
                          height={300}
                          className='rounded-lg border border-slate-300 dark:border-slate-600'
                        />
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        5
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          In the SAML Configuration step, fill in the following details:
                        </p>
                        <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm'>
                          <div>
                            <p className='font-semibold text-slate-900 dark:text-white'>
                              Single sign on URL:
                            </p>
                            <p className='text-slate-600 dark:text-slate-400 font-mono text-xs break-all'>
                              {BangDBConfig.saml.callbackUrl}
                            </p>
                          </div>
                          <div className='border-t border-slate-200 dark:border-slate-700 pt-2'>
                            <p className='font-semibold text-slate-900 dark:text-white'>
                              Audience URI (SP Entity ID):
                            </p>
                            <p className='text-slate-600 dark:text-slate-400 font-mono text-xs break-all'>
                              {BangDBConfig.saml.entityId}
                            </p>
                          </div>
                          <div className='border-t border-slate-200 dark:border-slate-700 pt-2'>
                            <p className='font-semibold text-slate-900 dark:text-white'>Name ID format:</p>
                            <p className='text-slate-600 dark:text-slate-400 font-mono text-xs break-all'>
                              EmailAddress
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        6
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          Configure Attribute Statements. Map the following attributes:
                        </p>
                        <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm font-mono'>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>emailAddress</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.email</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>firstName</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.firstName</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>lastName</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.lastName</span>
                          </div>
                        </div>
                        <Image
                          src='/images/guides/okta-create-app-2.webp'
                          alt='Okta attribute statements configuration'
                          width={600}
                          height={350}
                          className='rounded-lg border border-slate-300 dark:border-slate-600 mt-3'
                        />
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        7
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Click <strong>Next</strong>, then assign users/groups to this application
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        8
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Click <strong>Finish</strong> to complete the app creation
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {provider === 'ms_entra' && (
                <div className='space-y-6'>
                  <Alert className='mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 w-fit'>
                    <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                    <AlertDescription className='text-amber-800 dark:text-amber-300 inline pr-2'>
                      <strong>Important:</strong> Select <strong>SAML</strong> when choosing the SSO
                      authentication type.
                    </AlertDescription>
                  </Alert>

                  <div className='space-y-4'>
                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        1
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Sign in to the Microsoft Entra admin center
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        2
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Navigate to <strong>Enterprise applications → New application</strong>
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        3
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          Click <strong>Create your own application</strong>
                        </p>
                        <Image
                          src='/images/guides/entra-create-app-1.webp'
                          alt='Microsoft Entra ID new application creation screen'
                          width={600}
                          height={300}
                          className='rounded-lg border border-slate-300 dark:border-slate-600'
                        />
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        4
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          Select{' '}
                          <strong>
                            Integrate any other application you don`t find in the gallery (Non-gallery)
                          </strong>
                        </p>
                        <Image
                          src='/images/guides/entra-create-app-2.webp'
                          alt='Microsoft Entra ID non-gallery application option'
                          width={600}
                          height={300}
                          className='rounded-lg border border-slate-300 dark:border-slate-600'
                        />
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        5
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        {`Enter a name for your application (e.g., "BangDB") and click `}
                        <strong>Create</strong>
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        6
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        After creation, click <strong>Set up single sign on</strong> <br />
                        {`(You can find your new app in "Enterprise applications" section)`}
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        7
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Select <strong>SAML</strong> as the single sign-on method
                      </p>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        8
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          In <strong>Basic SAML Configuration</strong>, fill in:
                        </p>
                        <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm'>
                          <div>
                            <p className='font-semibold text-slate-900 dark:text-white'>
                              Identifier (Entity ID):
                            </p>
                            <p className='text-slate-600 dark:text-slate-400 font-mono text-xs break-all'>
                              {BangDBConfig.saml.entityId}
                            </p>
                          </div>
                          <div className='border-t border-slate-200 dark:border-slate-700 pt-2'>
                            <p className='font-semibold text-slate-900 dark:text-white'>
                              Reply URL (Assertion Consumer Service URL):
                            </p>
                            <p className='text-slate-600 dark:text-slate-400 font-mono text-xs break-all'>
                              {BangDBConfig.saml.callbackUrl}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        9
                      </div>
                      <div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5 mb-2'>
                          Configure Attribute Mappings. Set the following claims:
                        </p>
                        <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm font-mono'>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>givenname</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.givenname</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>surname</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.surname</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>emailaddress</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.mail</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>name</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.userprincipalname</span>
                          </div>
                          <div className='text-slate-700 dark:text-slate-300'>
                            <span className='text-slate-900 dark:text-white'>groups</span> →{' '}
                            <span className='text-blue-600 dark:text-blue-400'>user.assignedroles</span>
                          </div>
                        </div>
                        <p className='text-slate-600 dark:text-slate-400 text-xs mt-2'>
                          <strong>Unique User Identifier:</strong> Set to{' '}
                          <span className='font-mono'>user.userprincipalname</span>
                        </p>
                        <Image
                          src='/images/guides/entra-create-app-3.webp'
                          alt='Microsoft Entra ID SAML attribute mappings'
                          width={600}
                          height={350}
                          className='rounded-lg border border-slate-300 dark:border-slate-600 mt-3'
                        />
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                        10
                      </div>
                      <p className='text-slate-700 dark:text-slate-300 pt-0.5'>
                        Click <strong>Save</strong>, then assign users/groups to this application
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step-by-step Setup */}
          <Card id='configure-bangdb' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='text-lg'>Configure BangDB Settings</CardTitle>
              <CardDescription>
                After creating the app in your provider, configure it in BangDB
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Step 1 */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm'>
                    1
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Add Email Domain</h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400 mb-3'>
                  {`Go to <strong>Settings → Organization → Basic Details</strong> and add your organization's
                  email domain (e.g., company.com). Only users with this email domain will be able to log in
                  via SSO.`}
                </p>
                <Image
                  src='/images/guides/email-domain-setting.webp'
                  alt='Organization settings page showing email domain field'
                  width={600}
                  height={300}
                  className='rounded-lg border border-slate-300 dark:border-slate-600 mb-3'
                />
              </div>

              {/* Step 2 */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm'>
                    2
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Enable SAML SSO</h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400 mb-3'>
                  In <strong>Settings → Organization</strong>, find the SAML Configuration section and click
                  the enable toggle.
                </p>
                <Image
                  src='/images/guides/sso-enable.webp'
                  alt='SAML configuration toggle in organization settings'
                  width={600}
                  height={250}
                  className='rounded-lg border border-slate-300 dark:border-slate-600 mb-3'
                />
              </div>

              {/* Step 3 */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm'>
                    3
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Configure Metadata</h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400 mb-4'>
                  A modal will open. You can either paste the metadata URL or the raw XML metadata. Click{' '}
                  <strong>Parse Metadata</strong> to extract the configuration.
                </p>

                <Alert className='mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                  <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                  <AlertDescription className='text-blue-800 dark:text-blue-300'>
                    <strong>Finding your metadata URL:</strong> See the provider-specific instructions below.
                  </AlertDescription>
                </Alert>

                <Image
                  src='/images/guides/saml-metadata.webp'
                  alt='SAML metadata configuration modal with URL input'
                  width={600}
                  height={350}
                  className='rounded-lg border border-slate-300 dark:border-slate-600'
                />
              </div>

              {/* Step 4 */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm'>
                    4
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                    Review & Configure Fields
                  </h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400 mb-4'>
                  {`After parsing, you'll see the extracted SAML configuration. Review and adjust if needed:`}
                </p>

                <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3 mb-4'>
                  <div>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white mb-1'>SSO URL</p>
                    <p className='text-xs text-slate-600 dark:text-slate-400'>
                      The endpoint where users will be sent for authentication. This comes from your identity
                      provider.
                    </p>
                  </div>
                  <div className='border-t border-slate-200 dark:border-slate-700 pt-3'>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white mb-1'>Certificate</p>
                    <p className='text-xs text-slate-600 dark:text-slate-400'>
                      Used to verify the SAML responses. Auto-populated from metadata.
                    </p>
                  </div>
                  <div className='border-t border-slate-200 dark:border-slate-700 pt-3'>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white mb-1'>Entity ID</p>
                    <p className='text-xs text-slate-600 dark:text-slate-400'>
                      Unique identifier for your SAML application in the identity provider.
                    </p>
                  </div>
                  <div className='border-t border-slate-200 dark:border-slate-700 pt-3'>
                    <p className='text-sm font-semibold text-slate-900 dark:text-white mb-1'>
                      Logout URL (Optional)
                    </p>
                    <p className='text-xs text-slate-600 dark:text-slate-400'>
                      Where users are sent after logging out.
                    </p>
                  </div>
                </div>

                <Alert className='mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'>
                  <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                  <AlertDescription className='text-amber-800 dark:text-amber-300'>
                    <strong>Callback URL & Issuer:</strong> These are generated by BangDB and read-only.
                    {`They're needed when configuring your SAML app in your identity provider.`}
                  </AlertDescription>
                </Alert>

                <Image
                  src='/images/guides/sso-setup-review.webp'
                  alt='SAML configuration form showing SSO URL, certificate, entity ID, and attribute mapping'
                  width={600}
                  height={400}
                  className='rounded-lg border border-slate-300 dark:border-slate-600 mb-4'
                />

                <p className='text-slate-600 dark:text-slate-400 mb-3'>
                  <strong>Attribute Mapping:</strong>{' '}
                  {`Map your identity provider's attributes to BangDB user
                  fields:`}
                </p>
                <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm'>
                  <p className='text-slate-700 dark:text-slate-300'>
                    • <strong>Email:</strong> Required. Maps to user email address
                  </p>
                  <p className='text-slate-700 dark:text-slate-300'>
                    • <strong>First Name:</strong> {`User's first name`}
                  </p>
                  <p className='text-slate-700 dark:text-slate-300'>
                    • <strong>Last Name:</strong> {`User's last name`}
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm'>
                    5
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>Save Configuration</h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400'>
                  Click the <strong>Save</strong> button to save your SAML configuration. The modal will close
                  and your settings are now active.
                </p>
              </div>

              {/* Step 6 */}
              <div className='border-l-4 border-green-500 pl-4'>
                <div className='flex items-center space-x-3 mb-3'>
                  <div className='flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold text-sm'>
                    6
                  </div>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                    (Optional) Enable SCIM
                  </h3>
                </div>
                <p className='text-slate-600 dark:text-slate-400 mb-3'>
                  {`Below the SAML section, you'll see the SCIM Configuration. Toggle it to enable automatic
                  user provisioning and de-provisioning.`}
                </p>
                <p className='text-slate-600 dark:text-slate-400 mb-3'>{`Once enabled, you'll see:`}</p>
                <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm mb-3'>
                  <p className='text-slate-700 dark:text-slate-300'>
                    {`• <strong>SCIM Base URL:</strong> Copy this into your identity provider's SCIM settings`}
                  </p>
                  <p className='text-slate-700 dark:text-slate-300'>
                    • <strong>Authorization Token:</strong> A Bearer token for API authentication. Share this
                    with your identity provider securely.
                  </p>
                </div>
                <Image
                  src='/images/guides/scim-setup.webp'
                  alt='SCIM configuration showing base URL and bearer token'
                  width={600}
                  height={250}
                  className='rounded-lg border border-slate-300 dark:border-slate-600'
                />
              </div>
            </CardContent>
          </Card>

          {/* Provider-Specific Instructions */}
          <Card id='provider-instructions' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2 text-lg'>
                <div className='w-5 h-5'>{IconComponent}</div>
                <span>{config.name} Setup Instructions</span>
              </CardTitle>
              <CardDescription>
                Follow these steps in your {config.name} admin console while setting up BangDB SSO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='metadata' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='metadata'>Finding Metadata URL</TabsTrigger>
                  <TabsTrigger value='scim'>Configuring SCIM</TabsTrigger>
                </TabsList>

                <TabsContent value='metadata' className='space-y-4 mt-6'>
                  <Alert className='bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                    <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    <AlertDescription className='text-blue-800 dark:text-blue-300'>
                      <strong>Example URL:</strong> {config.metadataExample}
                    </AlertDescription>
                  </Alert>

                  <div className='space-y-4'>
                    {config.metadataSteps.map((step, index) => (
                      <div key={index} className='flex space-x-3'>
                        <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                          {index + 1}
                        </div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5'>{step}</p>
                      </div>
                    ))}
                  </div>

                  <Alert className='bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'>
                    <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                    <AlertDescription className='text-green-800 dark:text-green-300'>
                      <strong>Tip:</strong> Paste this metadata URL into the BangDB modal in Step 3 above.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value='scim' className='space-y-4 mt-6'>
                  <Alert className='bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'>
                    <AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                    <AlertDescription className='text-amber-800 dark:text-amber-300'>
                      <strong>Important:</strong> First complete SAML setup above, then enable SCIM in BangDB
                      to get the Base URL and token.
                    </AlertDescription>
                  </Alert>
                  <Alert className='bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'>
                    <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                    <AlertDescription className='text-green-800 dark:text-green-300'>
                      <strong>Tip:</strong> When prompted for SCIM endpoint and token in {config.name}, use
                      the values from your BangDB SCIM Configuration section.
                    </AlertDescription>
                  </Alert>

                  <div className='space-y-4'>
                    {config.scimSteps.map((step, index) => (
                      <div key={index} className='flex space-x-3'>
                        <div className='shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300'>
                          {index + 1}
                        </div>
                        <p className='text-slate-700 dark:text-slate-300 pt-0.5'>{step}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Testing SSO */}
          <Card id='test-sso' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='text-lg'>Test Your SSO Setup</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-slate-600 dark:text-slate-400'>
                Once everything is configured, test the login flow:
              </p>
              <ol className='space-y-3 list-decimal list-inside'>
                <li className='text-slate-700 dark:text-slate-300'>
                  Log out of BangDB or use an incognito window
                </li>
                <li className='text-slate-700 dark:text-slate-300'>Go to the BangDB login page</li>
                <li className='text-slate-700 dark:text-slate-300'>
                  Click <strong>Continue with SSO</strong>
                </li>
                <li className='text-slate-700 dark:text-slate-300'>
                  Enter an email with your configured domain
                </li>
                <li className='text-slate-700 dark:text-slate-300'>
                  You should be redirected to {config.name} for authentication
                </li>
                <li className='text-slate-700 dark:text-slate-300'>
                  {`After successful authentication, you'll be redirected back to BangDB`}
                </li>
              </ol>

              <Alert className='bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                <AlertDescription className='text-green-800 dark:text-green-300'>
                  If the test succeeds, your SSO is ready! Your team members can now log in using their{' '}
                  {config.name} credentials.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card id='faq' className='mb-8 border-slate-200 dark:border-slate-700'>
            <CardHeader>
              <CardTitle className='text-lg'>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>Do I have to use SCIM?</h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  {`No, SCIM is optional. It's useful if you want automatic user de-provisioning—when someone
                    leaves your company and is removed from ${config.name}, they'll automatically lose access to
                    BangDB. Without SCIM, you'd need to manually remove them.`}
                </p>
              </div>

              <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>
                  What if a user tries to log in with a different email domain?
                </h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  {`SSO login is restricted to the email domain you configured in your BangDB organization
                  settings. Users with emails from other domains won't be able to log in via SSO and should
                  use regular email/password login if enabled.`}
                </p>
              </div>

              <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>
                  What happens if I change the SAML configuration?
                </h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  {`Changes take effect immediately. Existing sessions won't be affected, but new login attempts
                  will use the updated configuration. We recommend testing thoroughly before rolling out to
                  your team.`}
                </p>
              </div>

              <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>
                  Can I use multiple identity providers?
                </h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  Currently, BangDB supports one SAML configuration per organization. If you need multiple
                  providers, please contact{' '}
                  <a
                    href='mailto:support@bangdb.com'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    support@bangdb.com
                  </a>
                  .
                </p>
              </div>

              <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>
                  What if my attribute mapping is wrong?
                </h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  You can edit the attribute mapping anytime by udating your SAML configuration.
                </p>
              </div>

              <div className='border-t border-slate-200 dark:border-slate-700 pt-6'>
                <h4 className='font-semibold text-slate-900 dark:text-white mb-2'>
                  {`I'm getting an error during SCIM test connection. What should I do?`}
                </h4>
                <p className='text-slate-600 dark:text-slate-400'>
                  {`Check that you've copied the exact SCIM Base URL and Bearer token from BangDB. Ensure SAML
                  is enabled first—SCIM requires a working SAML setup. If the issue persists, contact  
                  `}
                  <a
                    href='mailto:support@bangdb.com'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    support@bangdb.com
                  </a>{' '}
                  with the error message.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
