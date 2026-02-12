import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookie } from '@/utils/cookie'
import { jwtVerify } from 'jose'

const SECRET = process.env.JWT_SECRET_USER_ROLE || ''

const ROLE_ROUTES = {
    ADMIN_ROUTES: ['/in/admin', '/in/admin/certificates', '/in/allocation', '/in/nuclei/create', '/in/my-team/add'],
    MEMBER_ROUTES: ['/in/my-team', '/in/nuclei', '/in/tools', '/in/requests', '/in/docs'],
    CANDIDATE_ROUTES: ['/in/selection-process']
};

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (path.startsWith('/api/')) {
        const fetchMode = req.headers.get('sec-fetch-mode');
        const fetchDest = req.headers.get('sec-fetch-dest');
        
        // const referer = req.headers.get('referer');
        // const host = req.headers.get('host');

        const isDownloadRoute = path.includes('file_download') || path.endsWith('/download');
        
        // const isInternalRequest = referer && referer.includes(host || '');

        if (isDownloadRoute) {
            if (true) {
                return NextResponse.next();
            }
            return new NextResponse(null, { status: 404 });
        }

        if (fetchDest === 'document' || fetchMode === 'navigate') {
            return new NextResponse(null, { status: 404 });
        }

        return NextResponse.next();
    }

    const isProtectedRoute = path.startsWith('/in/');

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    const session = await getCookie('user-session');

    if (!session) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    const roleCookie = await getCookie('user_role_secure');
    let userRole = 'GUEST';

    if (roleCookie) {
        try {
            const { payload } = await jwtVerify(roleCookie, new TextEncoder().encode(SECRET)) as { payload: { role?: string } };
            userRole = payload.role as string;
        } catch (e) {
            userRole = 'GUEST';
        }
    }

    // --- REGRA 1: Proteção de Líder/Admin ---
    if (ROLE_ROUTES.ADMIN_ROUTES.some(route => path.startsWith(route))) {
        if (userRole !== 'LEADER' && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/in', req.url));
        }
    }

    // --- REGRA 3: Candidato tentando ver coisas de Membro ---
    if (ROLE_ROUTES.MEMBER_ROUTES.some(route => path.startsWith(route))) {
        if (userRole === 'USER') {
            return NextResponse.redirect(new URL('/in/selection-process', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}