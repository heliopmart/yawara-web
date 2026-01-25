import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCookie } from '@/utils/cookie'
import { jwtVerify  } from 'jose'

const SECRET = process.env.JWT_SECRET_USER_ROLE || ''

const ROLE_ROUTES = {
    ADMIN_ROUTES: ['/in/admin', '/in/certificates', '/in/allocation'],
    MEMBER_ROUTES: ['/in/my-team', '/in/nuclei', '/in/tools', '/in/requests', '/in/docs'],
    CANDIDATE_ROUTES: ['/in/processo-seletivo']
};

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
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

    console.log(userRole)

    // --- REGRA 1: Proteção de Líder/Admin ---
    if (ROLE_ROUTES.ADMIN_ROUTES.some(route => path.startsWith(route))) {
        if (userRole !== 'LEADER' && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/in', req.url));
        }
    }

    // --- REGRA 2: Proteção de Processo Seletivo ---
    if (path.startsWith('/in/processo-seletivo')) {
        if (userRole === 'MEMBER' || userRole === 'LEADER') {
            return NextResponse.redirect(new URL('/in/my-team', req.url));
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
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}