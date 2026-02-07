import { NextResponse } from 'next/server';
import { getCookie } from "@/utils/cookie"
import { jwtVerify  } from 'jose'


const SECRET = process.env.JWT_SECRET_USER_ROLE || ''

export async function GET() {
    const token = await getCookie('user_role_secure');
    if (!token) {
        return NextResponse.json({ role: 'GUEST' });
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET)) as { payload: {role: string} };
        
        return NextResponse.json({ role: payload.role ?? 'GUEST' });
    } catch (error) {
        return NextResponse.json({ role: 'GUEST' });
    }
}