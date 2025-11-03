'use server';

import { cookies } from 'next/headers';

export async function setTheme(theme: 'light' | 'nyungwe') {
  const cookieStore = await cookies();
  cookieStore.set('theme', theme, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
}
