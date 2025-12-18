'use client';
import React, { useCallback, useEffect, useState } from 'react';

import { SupportedProviders } from '@/types/organization';
import { MSIcon, OktaIcon } from '../assets/icons';

import { NativeSelect, NativeSelectOption } from '../ui/native-select';

const navItems = [
  { id: 'overview', label: 'What is SSO & SCIM', level: 0 },
  { id: 'prerequisites', label: 'Prerequisites', level: 0 },
  { id: 'create-app', label: 'Create SAML Application', level: 0 },
  { id: 'configure-bangdb', label: 'Configure BangDB Settings', level: 0 },
  { id: 'provider-instructions', label: 'Provider-Specific Instructions', level: 0 },
  { id: 'test-sso', label: 'Test Your SSO Setup', level: 0 },
  { id: 'faq', label: 'FAQ', level: 0 }
];

type Props = {
  provider: SupportedProviders;
  setProvider: (value: SupportedProviders) => void;
};

/**
 * Left Sidebar Navigation for help guides
 */
export default function GuideContentsNav({ provider, setProvider }: Props) {
  const [activeSection, setActiveSection] = useState('overview');

  const handleScroll = useCallback(() => {
    const sections = navItems.map(item => item.id);
    const scrollPosition = window.scrollY + 100;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const { offsetTop, offsetHeight } = element;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection(section);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });

      // set a delay to state update, as the active item indicator flashes thorugh all the items in between
      setTimeout(() => {
        setActiveSection(sectionId);
      }, 500);
    }
  }, []);

  return (
    <nav className='hidden lg:block w-56 shrink-0'>
      <div className='fixed w-56 h-screen overflow-y-auto pr-4'>
        <div className='mb-4'>
          <h3 className='text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3'>
            Identity Provider
          </h3>
          <div className='relative ml-1'>
            <div className='w-4.5 top-2.5 left-2.5 absolute'>{provider === 'okta' ? OktaIcon : MSIcon}</div>
            <NativeSelect
              id='idp'
              className={'pl-[34px]'}
              value={provider}
              onChange={ev => setProvider(ev.currentTarget.value as SupportedProviders)}
            >
              <NativeSelectOption value='okta'>Okta</NativeSelectOption>
              <NativeSelectOption value='entra'>Microsoft Entra ID</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className='border-t border-slate-200 dark:border-slate-700 pt-6 px-1'>
          <h3 className='text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3'>
            On This Page
          </h3>
          <ul className='space-y-2'>
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`text-[14px] w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/15 text-gray-800 dark:text-gray-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
