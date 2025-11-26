import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookie } from '@/utils/cookie'

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    const isProtectedRoute = path.startsWith('/account');

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    const session = await getCookie('user-session');

    if (!session && isProtectedRoute) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}