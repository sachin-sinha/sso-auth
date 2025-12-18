import { clsx, type ClassValue } from 'clsx';
import { randomBytes } from 'crypto';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePassword(chars: number = 12) {
  return (
    randomBytes(chars)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, chars - 1) + '@'
  );
}
