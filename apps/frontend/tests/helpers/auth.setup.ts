import axios from 'axios';
const PATH_API = process.env.PATH_API || 'http://localhost:3000/api';

// Save cookie in memory to reuse across test requests
let sessionCookie: string | null = null;

export async function getAuthCookie() {
    if (sessionCookie) return sessionCookie;

    try {
        const response = await axios.post(`${PATH_API}/auth/login`, {
            email: process.env.TEST_USER_EMAIL,
            password: process.env.TEST_USER_PASS
        }, {
            // Important to not follow redirects and lose the cookie along the way
            withCredentials: true 
        });

        // Capture the cookie from the 'set-cookie' header
        // In the browser this is automatic, here in Node/TS we need to get it manually
        const cookies = response.headers['set-cookie'];

        
        if (!cookies) {
            throw new Error('Falha ao obter cookie de sessão: Cabeçalho set-cookie ausente.');
        }
        
        sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
        return sessionCookie;

    } catch (error) {
        console.error('❌ Erro na Autenticação do Teste:', error);
        throw error;
    }
}