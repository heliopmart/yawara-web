import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { getAuthCookie } from '../helpers/auth.setup';

import { NucleiShowProps } from "@yawara/types"

const PATH_API = process.env.PATH_API || 'http://localhost:3000/api';

it('deve carregar os dados do time usando o cookie de sessão', async () => {
    const cookie = await getAuthCookie();

    const response = await axios.get<{
        data: NucleiShowProps[]
    }>(
        `${PATH_API}/admin/nuclei`,
        { headers: { 'Cookie': cookie } }
    );

    expect(response.status).toBe(200);

    const payload = response.data.data;

    expect(Array.isArray(payload)).toBe(true);

    if (payload.length > 0) {
        expect(payload[0]).toHaveProperty('name');
        expect(payload[0].nucleiConfig).toHaveProperty('totalMembers');
        expect(Array.isArray(payload[0].activeArts)).toBe(true);
    }
    
    if (payload[0].activeArts.length > 0) {
        expect(payload[0].activeArts[0]).toHaveProperty('title');
    }

    console.log('✅ Integração com API de dados do myTeam bem-sucedida.');
});