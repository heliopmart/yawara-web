'use server'

import { cookies } from 'next/headers';

export const getCookie = async (name: string) => {
    const cookieStore = cookies();
    const store = await cookieStore;
    return store.get(name)?.value || null;
}

export const setCookie = async (name: string, value: string, options: { maxAge?: number } = {}) => {
    const store = await cookies();
    store.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: options.maxAge || 60 * 60 * 24 * 7,
    });
}